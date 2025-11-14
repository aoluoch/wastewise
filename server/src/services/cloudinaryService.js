const cloudinary = require('cloudinary').v2
const { CloudinaryStorage } = require('multer-storage-cloudinary')
const multer = require('multer')

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Configure Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'wastewise',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'svg', 'ico'],
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
})

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
    files: 5, // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    console.log('File filter - MIME type:', file.mimetype, 'Field name:', file.fieldname)
    const allowedTypes = (
      process.env.ALLOWED_FILE_TYPES ||
      'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/tiff,image/svg+xml,image/x-icon,image/vnd.microsoft.icon'
    ).split(',')

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      console.log(
        'File rejected - MIME type:',
        file.mimetype,
        'not in allowed types:',
        allowedTypes
      )
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`), false)
    }
  },
})

// Upload single image
const uploadSingle = upload.single('image')

// Upload multiple images
const uploadMultiple = upload.array('images', 5)

// Delete image from Cloudinary
const deleteImage = async publicId => {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result
  } catch (error) {
    throw new Error(`Failed to delete image: ${error.message}`)
  }
}

// Delete multiple images
const deleteImages = async publicIds => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds)
    return result
  } catch (error) {
    throw new Error(`Failed to delete images: ${error.message}`)
  }
}

// Get image info
const getImageInfo = async publicId => {
  try {
    const result = await cloudinary.api.resource(publicId)
    return result
  } catch (error) {
    throw new Error(`Failed to get image info: ${error.message}`)
  }
}

// Generate image URL with transformations
const generateImageUrl = (publicId, transformations = {}) => {
  return cloudinary.url(publicId, {
    ...transformations,
    secure: true,
  })
}

// Extract public ID from Cloudinary URL
const extractPublicId = url => {
  const regex = /\/v\d+\/(.+)\.(jpg|jpeg|png|webp|gif)$/
  const match = url.match(regex)
  return match ? match[1] : null
}

module.exports = {
  cloudinary,
  uploadSingle,
  uploadMultiple,
  deleteImage,
  deleteImages,
  getImageInfo,
  generateImageUrl,
  extractPublicId,
}
