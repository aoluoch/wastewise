const nodemailer = require('nodemailer')

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  })
}

// Email templates
const emailTemplates = {
  welcome: user => ({
    subject: 'Welcome to Wastewise!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Welcome to Wastewise!</h2>
        <p>Hello ${user.firstName},</p>
        <p>Welcome to Wastewise! We're excited to have you join our community of responsible waste management.</p>
        <p>With your account, you can:</p>
        <ul>
          <li>Report waste issues in your area</li>
          <li>Track pickup schedules</li>
          <li>Receive real-time updates</li>
          <li>Contribute to a cleaner environment</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The Wastewise Team</p>
      </div>
    `,
  }),

  reportCreated: (user, report) => ({
    subject: 'Waste Report Submitted Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Report Submitted Successfully</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your waste report has been submitted successfully and is now being reviewed.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Report Details:</h3>
          <p><strong>Type:</strong> ${report.type}</p>
          <p><strong>Description:</strong> ${report.description}</p>
          <p><strong>Location:</strong> ${report.location.address}</p>
          <p><strong>Priority:</strong> ${report.priority}</p>
          <p><strong>Status:</strong> ${report.status}</p>
        </div>
        <p>We'll notify you once a collector is assigned to your report.</p>
        <p>Thank you for helping keep our community clean!</p>
        <p>Best regards,<br>The Wastewise Team</p>
      </div>
    `,
  }),

  pickupScheduled: (user, pickupTask) => ({
    subject: 'Waste Pickup Scheduled',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Pickup Scheduled</h2>
        <p>Hello ${user.firstName},</p>
        <p>Great news! Your waste pickup has been scheduled.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Pickup Details:</h3>
          <p><strong>Scheduled Date:</strong> ${new Date(pickupTask.scheduledDate).toLocaleDateString()}</p>
          <p><strong>Scheduled Time:</strong> ${new Date(pickupTask.scheduledDate).toLocaleTimeString()}</p>
          <p><strong>Estimated Duration:</strong> ${pickupTask.estimatedDuration} minutes</p>
          ${pickupTask.notes ? `<p><strong>Notes:</strong> ${pickupTask.notes}</p>` : ''}
        </div>
        <p>Please ensure your waste is accessible at the scheduled time.</p>
        <p>Best regards,<br>The Wastewise Team</p>
      </div>
    `,
  }),

  pickupCompleted: (user, pickupTask) => ({
    subject: 'Waste Pickup Completed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Pickup Completed</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your waste pickup has been completed successfully!</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Completion Details:</h3>
          <p><strong>Completed At:</strong> ${new Date(pickupTask.actualEndTime).toLocaleString()}</p>
          <p><strong>Duration:</strong> ${pickupTask.actualDuration} minutes</p>
          ${pickupTask.completionNotes ? `<p><strong>Notes:</strong> ${pickupTask.completionNotes}</p>` : ''}
        </div>
        <p>Thank you for using Wastewise! Your contribution helps keep our community clean.</p>
        <p>Best regards,<br>The Wastewise Team</p>
      </div>
    `,
  }),

  passwordReset: (user, resetToken) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2E7D32;">Password Reset Request</h2>
        <p>Hello ${user.firstName},</p>
        <p>You have requested to reset your password for your Wastewise account.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
          <p>Click the button below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}" 
             style="background-color: #2E7D32; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The Wastewise Team</p>
      </div>
    `,
  }),

  systemAlert: (user, alert) => ({
    subject: 'System Alert - Wastewise',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #D32F2F;">System Alert</h2>
        <p>Hello ${user.firstName},</p>
        <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #D32F2F;">
          <h3>${alert.title}</h3>
          <p>${alert.message}</p>
        </div>
        <p>Please take appropriate action if required.</p>
        <p>Best regards,<br>The Wastewise Team</p>
      </div>
    `,
  }),
}

// Send email function
const sendEmail = async (to, templateName, templateData) => {
  try {
    const transporter = createTransporter()
    try {
      await transporter.verify()
      console.log('SMTP transporter verified')
    } catch (verifyError) {
      console.error('SMTP verify failed:', verifyError)
      throw verifyError
    }
    const template = emailTemplates[templateName]

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`)
    }

    const emailContent = template(templateData)

    const fromAddress = process.env.EMAIL_FROM || 'Wastewise <noreply@wastewise.local>'
    const mailOptions = {
      from: fromAddress,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', result.messageId)
    return result
  } catch (error) {
    console.error('Email sending failed:', {
      message: error && error.message,
      code: error && error.code,
      command: error && error.command,
      response: error && error.response,
      responseCode: error && error.responseCode,
    })
    throw error
  }
}

// Send bulk emails
const sendBulkEmails = async (recipients, templateName, templateData) => {
  try {
    const transporter = createTransporter()
    try {
      await transporter.verify()
      console.log('SMTP transporter verified')
    } catch (verifyError) {
      console.error('SMTP verify failed:', verifyError)
      throw verifyError
    }
    const template = emailTemplates[templateName]

    if (!template) {
      throw new Error(`Email template '${templateName}' not found`)
    }

    const emailContent = template(templateData)

    const fromAddress = process.env.EMAIL_FROM || 'Wastewise <noreply@wastewise.local>'
    const mailOptions = {
      from: fromAddress,
      to: recipients.join(', '),
      subject: emailContent.subject,
      html: emailContent.html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Bulk email sent successfully:', result.messageId)
    return result
  } catch (error) {
    console.error('Bulk email sending failed:', {
      message: error && error.message,
      code: error && error.code,
      command: error && error.command,
      response: error && error.response,
      responseCode: error && error.responseCode,
    })
    throw error
  }
}

// Send custom email
const sendCustomEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter()
    try {
      await transporter.verify()
      console.log('SMTP transporter verified')
    } catch (verifyError) {
      console.error('SMTP verify failed:', verifyError)
      throw verifyError
    }

    const fromAddress = process.env.EMAIL_FROM || 'Wastewise <noreply@wastewise.local>'
    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log('Custom email sent successfully:', result.messageId)
    return result
  } catch (error) {
    console.error('Custom email sending failed:', {
      message: error && error.message,
      code: error && error.code,
      command: error && error.command,
      response: error && error.response,
      responseCode: error && error.responseCode,
    })
    throw error
  }
}

// Verify email configuration
const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('Email configuration verified successfully')
    return true
  } catch (error) {
    console.error('Email configuration verification failed:', error)
    return false
  }
}

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendCustomEmail,
  verifyEmailConfig,
  emailTemplates,
}
