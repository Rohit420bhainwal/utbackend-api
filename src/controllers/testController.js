const { uploadToS3 } = require("../services/s3.service");

exports.testUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file selected",
      });
    }

    const result = await uploadToS3(req.file, "services");

    res.json({
      success: true,
      message: "Uploaded successfully",
      data: result,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};