const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, checkPermission } = require('../../middleware/auth');
const { dbMethods } = require('../../modules/database/backend');

// Set up storage for QR code images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'qr-codes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'qrcode-' + uniqueSuffix + ext);
  }
});

// Set up upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (!file) return cb(new Error('No file provided'), false);
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed!'), false);
    if (!['.jpg', '.jpeg', '.png'].includes(path.extname(file.originalname).toLowerCase())) return cb(new Error('Only JPG, JPEG and PNG files are allowed!'), false);
    cb(null, true);
  }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File is too large. Maximum size is 2MB.' });
        }
        return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
        return res.status(500).json({ error: err.message || 'An unknown error occurred during upload' });
    }
    next();
};

/**
 * @route   GET /api/payment/qr-codes/active
 * @desc    Get the currently active QR code for payments
 * @access  Private (requires authentication)
 */
router.get('/active', authenticateToken, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const sql = `
            SELECT * FROM base_payment_qr
            WHERE isActive = 1
            ORDER BY updated_at DESC
            LIMIT 1
        `;
        const activeQRCode = await dbMethods.get(db, sql, []);

        if (!activeQRCode) {
            return res.status(404).json({ error: 'No active QR code found' });
        }

        res.json({
            ...activeQRCode,
            active: Boolean(activeQRCode.isActive)
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @route   GET /api/payment/qr-codes
 * @desc    Get all QR codes
 * @access  Private (requires authentication and payment_view permission)
 */
router.get('/', [authenticateToken, checkPermission('payment_view')], async (req, res) => {
  try {
    const db = req.app.locals.db;
    const sql = `SELECT * FROM base_payment_qr ORDER BY created_at DESC`;
    const rows = await dbMethods.all(db, sql);
    
    const qrCodes = rows.map(row => ({
      ...row,
      active: Boolean(row.isActive)
    }));
    
    res.json(qrCodes);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/payment/qr-codes/:payment_qr_code_id
 * @desc    Get a specific QR code by ID
 * @access  Private (requires authentication and payment_view permission)
 */
router.get('/:payment_qr_code_id', [authenticateToken, checkPermission('payment_view')], async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { payment_qr_code_id } = req.params;
    const sql = 'SELECT * FROM base_payment_qr WHERE payment_qr_code_id = ?';
    const row = await dbMethods.get(db, sql, [payment_qr_code_id]);

    if (!row) {
      return res.status(404).json({ error: 'QR code not found' });
    }
    
    res.json({ ...row, active: Boolean(row.isActive) });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   POST /api/payment/qr-codes
 * @desc    Upload a new QR code
 * @access  Private (requires authentication and payment_edit permission)
 */
router.post('/', [authenticateToken, checkPermission('payment_edit'), upload.single('qr_code_image'), handleMulterError], async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { payment_qr_name, payment_description, payment_type } = req.body;

    if (!payment_qr_name || !payment_type) return res.status(400).json({ error: 'QR code name and payment type are required' });
    if (!req.file) return res.status(400).json({ error: 'QR code image is required' });

    const imageUrl = `/uploads/qr-codes/${path.basename(req.file.path)}`;
    const sql = `
      INSERT INTO base_payment_qr (payment_qr_name, payment_description, payment_type, payment_qr_image_location, isActive, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const result = await dbMethods.run(db, sql, [payment_qr_name, payment_description || '', payment_type, imageUrl]);
    const newQRCode = await dbMethods.get(db, 'SELECT * FROM base_payment_qr WHERE payment_qr_code_id = ?', [result.lastID]);

    res.status(201).json({ ...newQRCode, active: false });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Could not create QR code' });
  }
});

/**
 * @route   POST /api/payment/qr-codes/:payment_qr_code_id/activate
 * @desc    Activate a QR code (and deactivate all others)
 * @access  Private (requires authentication and payment_edit permission)
 */
router.post('/:payment_qr_code_id/activate', [authenticateToken, checkPermission('payment_edit')], async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { payment_qr_code_id } = req.params;

    await dbMethods.run(db, 'BEGIN TRANSACTION');
    await dbMethods.run(db, 'UPDATE base_payment_qr SET isActive = 0, updated_at = CURRENT_TIMESTAMP');
    const result = await dbMethods.run(db, 'UPDATE base_payment_qr SET isActive = 1, updated_at = CURRENT_TIMESTAMP WHERE payment_qr_code_id = ?', [payment_qr_code_id]);

    if (result.changes === 0) {
      await dbMethods.run(db, 'ROLLBACK');
      return res.status(404).json({ error: 'QR code not found' });
    }

    await dbMethods.run(db, 'COMMIT');
    const updatedQRCode = await dbMethods.get(db, 'SELECT * FROM base_payment_qr WHERE payment_qr_code_id = ?', [payment_qr_code_id]);

    res.json({ ...updatedQRCode, active: true, message: 'QR code activated successfully' });
  } catch (error) {
    const db = req.app.locals.db;
    await dbMethods.run(db, 'ROLLBACK');
    console.error('Server error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   DELETE /api/payment/qr-codes/:payment_qr_code_id
 * @desc    Delete a QR code
 * @access  Private (requires authentication and payment_edit permission)
 */
router.delete('/:payment_qr_code_id', [authenticateToken, checkPermission('payment_edit')], async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { payment_qr_code_id } = req.params;

    const qrCode = await dbMethods.get(db, 'SELECT payment_qr_image_location FROM base_payment_qr WHERE payment_qr_code_id = ?', [payment_qr_code_id]);
    if (!qrCode) return res.status(404).json({ error: 'QR code not found' });

    const result = await dbMethods.run(db, 'DELETE FROM base_payment_qr WHERE payment_qr_code_id = ?', [payment_qr_code_id]);
    if (result.changes === 0) return res.status(404).json({ error: 'QR code not found' });

    if (qrCode.payment_qr_image_location) {
      const imagePath = path.join(__dirname, '..', qrCode.payment_qr_image_location);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'QR code deleted successfully', payment_qr_code_id: parseInt(payment_qr_code_id) });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Could not delete QR code' });
  }
});

module.exports = router;