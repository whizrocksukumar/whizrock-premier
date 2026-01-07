export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Assessment Completed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066CC 0%, #004999 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Assessment Completed</h1>
              <p style="color: #e6f2ff; margin: 10px 0 0 0; font-size: 16px;">Product Recommendation Required</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{{va_name}}</strong>,
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                A free assessment has been completed and is ready for your review. Please create a product recommendation for this customer.
              </p>

              <!-- Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; margin: 30px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Assessment Reference:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">{{assessment_reference}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Customer:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">{{customer_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Site Address:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">{{site_address}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Assessment Date:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">{{assessment_date}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{create_recommendation_url}}"
                       style="display: inline-block; background-color: #0066CC; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,102,204,0.3);">
                      Create Product Recommendation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Additional Info -->
              <div style="background-color: #e8f4ff; border-left: 4px solid #0066CC; padding: 15px 20px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #004999; font-size: 14px; margin: 0; line-height: 1.6;">
                  <strong>📋 Next Steps:</strong><br>
                  1. Review the assessment report and building plans<br>
                  2. Create a detailed product recommendation<br>
                  3. Submit for Premier's approval
                </p>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                If you have any questions, please contact the office.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 12px; margin: 0 0 10px 0;">
                Whizrock Premier Insulation Services
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                This is an automated notification from your workflow system.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
