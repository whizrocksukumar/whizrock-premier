export const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Insulation Quote</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0066CC 0%, #004999 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Your Quote is Ready</h1>
              <p style="color: #e6f2ff; margin: 10px 0 0 0; font-size: 18px;">Quote {{quote_number}}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 18px; line-height: 1.6; margin: 0 0 20px 0;">
                Dear <strong>{{customer_name}}</strong>,
              </p>

              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Thank you for choosing Whizrock Premier for your insulation needs. We're pleased to provide you with a detailed quote for your property.
              </p>

              <!-- Quote Summary Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; margin: 30px 0;">
                <tr>
                  <td style="padding: 30px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 12px 0; color: #666666; font-size: 15px; font-weight: 600;">Property Address:</td>
                        <td style="padding: 12px 0; color: #333333; font-size: 15px; text-align: right;">{{site_address}}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 20px 0 10px 0; border-top: 2px solid #bfdbfe;">
                          <p style="color: #0066CC; font-size: 14px; margin: 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Total Investment</p>
                        </td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding: 0;">
                          <p style="color: #0066CC; font-size: 36px; margin: 0; font-weight: 700; text-align: center;">{{quote_amount}}</p>
                          <p style="color: #666666; font-size: 14px; margin: 5px 0 0 0; text-align: center;">Including GST</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="{{view_quote_url}}"
                       style="display: inline-block; background-color: #0066CC; color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,102,204,0.3);">
                      View Your Quote
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Benefits Section -->
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <p style="color: #334155; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">
                  🌟 What's Included:
                </p>
                <ul style="color: #475569; font-size: 14px; margin: 0; padding-left: 20px; line-height: 2;">
                  <li>Professional assessment and recommendation</li>
                  <li>Quality insulation materials</li>
                  <li>Expert installation by certified technicians</li>
                  <li>Job completion certificate</li>
                  <li>Comprehensive warranty coverage</li>
                </ul>
              </div>

              <!-- Contact Section -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="color: #92400e; font-size: 15px; margin: 0 0 12px 0; font-weight: 600;">
                  📞 Questions or Ready to Proceed?
                </p>
                <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.8;">
                  <strong>{{sales_rep_name}}</strong><br>
                  Email: <a href="mailto:{{sales_rep_email}}" style="color: #0066CC;">{{sales_rep_email}}</a><br>
                  Phone: <a href="tel:{{sales_rep_phone}}" style="color: #0066CC;">{{sales_rep_phone}}</a>
                </p>
              </div>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                We look forward to helping you improve your home's comfort and energy efficiency!
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
                Expert insulation solutions for New Zealand homes
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
