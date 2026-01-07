export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Completion Certificate</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 50px 30px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 15px;">✓</div>
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Job Completed!</h1>
              <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 18px;">Your Certificate is Ready</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>{{customer_name}}</strong>,
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                Congratulations! Your insulation installation has been successfully completed. We're pleased to provide you with your official Job Completion Certificate.
              </p>

              <!-- Certificate Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; margin: 30px 0; border: 2px solid #10b981;">
                <tr>
                  <td style="padding: 30px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td colspan="2" style="text-align: center; padding-bottom: 20px;">
                          <p style="color: #10b981; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 2px; font-weight: 700;">Certificate Number</p>
                          <p style="color: #065f46; font-size: 28px; margin: 10px 0 0 0; font-weight: 700; letter-spacing: 1px;">{{certificate_number}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 20px 0 10px 0; border-top: 2px solid #86efac;"></td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Property Address:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">{{site_address}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Completion Date:</td>
                        <td style="padding: 8px 0; color: #333333; font-size: 14px; text-align: right;">{{job_completion_date}}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #666666; font-size: 14px; font-weight: 600;">Warranty Period:</td>
                        <td style="padding: 8px 0; color: #10b981; font-size: 14px; text-align: right; font-weight: 600;">{{warranty_months}} Months</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{view_certificate_url}}"
                       style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 6px rgba(16,185,129,0.3);">
                      Download Certificate
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Warranty Information -->
              <div style="background-color: #eff6ff; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <p style="color: #1e40af; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">
                  🛡️ Your Warranty Coverage:
                </p>
                <ul style="color: #1e3a8a; font-size: 14px; margin: 0; padding-left: 20px; line-height: 2;">
                  <li>Workmanship warranty for {{warranty_months}} months</li>
                  <li>Materials warranty as per manufacturer specifications</li>
                  <li>Building Code compliance certification</li>
                  <li>Regular inspection and maintenance recommendations</li>
                </ul>
              </div>

              <!-- Care Instructions -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #92400e; font-size: 15px; margin: 0 0 10px 0; font-weight: 600;">
                  💡 Keeping Your Insulation in Top Condition:
                </p>
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.8;">
                  • Check for any signs of moisture or damage periodically<br>
                  • Ensure adequate ventilation in insulated areas<br>
                  • Contact us immediately if you notice any issues<br>
                  • Keep this certificate for warranty claims
                </p>
              </div>

              <!-- Thank You -->
              <div style="text-align: center; margin: 40px 0;">
                <p style="color: #333333; font-size: 18px; line-height: 1.6; margin: 0 0 15px 0; font-weight: 600;">
                  Thank You for Choosing Whizrock Premier!
                </p>
                <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                  We hope you enjoy improved comfort and energy savings for years to come.
                </p>
              </div>

              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 30px 0 0 0; text-align: center; font-style: italic;">
                Please keep this certificate in a safe place. You may need it for warranty claims,<br>
                building compliance records, or when selling your property.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 13px; margin: 0 0 10px 0; font-weight: 600;">
                Whizrock Premier Insulation Services
              </p>
              <p style="color: #999999; font-size: 12px; margin: 0;">
                Certified Insulation Specialists | Building Code Compliant
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
