export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recommendation Needs Approval</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Recommendation Ready for Review</h1>
              <p style="color: #f3e8ff; margin: 10px 0 0 0; font-size: 16px;">Approval Required</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{{premier_name}}</strong>,
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>{{va_name}}</strong> has completed a product recommendation and submitted it for your approval.
              </p>

              <!-- Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #faf5ff; border-radius: 8px; margin: 30px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">VA:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">{{va_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Customer:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">{{customer_name}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Site Address:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">{{site_address}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Buttons -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{review_url}}"
                       style="display: inline-block; background-color: #9333ea; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(147,51,234,0.3); margin: 0 10px;">
                      Review Recommendation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Review Checklist -->
              <div style="background-color: #fef3c7; border-left: 4px solid: #f59e0b; padding: 15px 20px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">
                  ⚠️ Review Checklist:
                </p>
                <ul style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
                  <li>Verify all assessment areas are covered</li>
                  <li>Check product specifications match requirements</li>
                  <li>Confirm quantities are accurate</li>
                  <li>Review any special notes or conditions</li>
                </ul>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
                Once approved, the VA will be notified to finalize the recommendation and convert it to a quote.
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
