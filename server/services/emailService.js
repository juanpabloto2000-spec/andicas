import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Andicas Bioparque <onboarding@resend.dev>';

const isRealResend = RESEND_API_KEY && !RESEND_API_KEY.includes('mock');
const resend = isRealResend ? new Resend(RESEND_API_KEY) : null;

/**
 * Genera la plantilla HTML Dark-Luxury del Voucher de Confirmación
 */
function buildVoucherHtml(booking) {
  const formatCOP = (num) => `$${Number(num).toLocaleString('es-CO')} COP`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Voucher de Reserva - Andicas Bioparque Temático</title>
</head>
<body style="margin: 0; padding: 0; background-color: #041B1C; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #FAF7F2;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #041B1C; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: linear-gradient(180deg, #072E2F 0%, #051E1F 100%); border: 1px solid #D8A232; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 35px 30px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.1);">
              <h1 style="margin: 0; font-size: 24px; color: #FCD477; text-transform: uppercase; letter-spacing: 2px; font-weight: 900;">
                ANDICAS BIOPARQUE TEMÁTICO
              </h1>
              <p style="margin: 6px 0 0; color: #E6DCCF; font-size: 13px; letter-spacing: 1px;">
                CONFIRMACIÓN OFICIAL DE RESERVA & VOUCHER
              </p>
            </td>
          </tr>

          <!-- Success Alert -->
          <tr>
            <td style="padding: 25px 30px; text-align: center; background-color: rgba(83, 158, 67, 0.15); border-bottom: 1px solid rgba(83, 158, 67, 0.3);">
              <span style="font-size: 32px;">✨🌿</span>
              <h2 style="margin: 10px 0 5px; color: #87D776; font-size: 20px;">¡Tu Noche en la Naturaleza está Confirmada!</h2>
              <p style="margin: 0; color: #FAF7F2; font-size: 14px;">
                Hola <strong>${booking.client_name}</strong>, hemos recibido con éxito tu anticipo del 50%.
              </p>
            </td>
          </tr>

          <!-- Booking Reference Badge -->
          <tr>
            <td style="padding: 25px 30px 10px; text-align: center;">
              <table align="center" border="0" cellspacing="0" cellpadding="0" style="background-color: #0B4A4B; border: 1px solid #FCD477; border-radius: 12px; padding: 12px 24px;">
                <tr>
                  <td>
                    <span style="color: #FAF7F2; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; display: block;">Código Único de Reserva:</span>
                    <strong style="color: #FCD477; font-size: 20px; letter-spacing: 2px; font-family: monospace;">${booking.booking_reference}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cabin Details -->
          <tr>
            <td style="padding: 15px 30px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(4, 27, 28, 0.8); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px;">
                <tr>
                  <td style="padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #FCD477; font-size: 11px; text-transform: uppercase; font-weight: bold;">Hospedaje Seleccionado:</span>
                    <h3 style="margin: 4px 0 0; color: #FAF7F2; font-size: 18px;">${booking.cabin_name}</h3>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 15px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="vertical-align: top;">
                          <p style="margin: 0; color: #C7B9A6; font-size: 12px;">📅 <strong>Check-In:</strong></p>
                          <p style="margin: 4px 0 10px; color: #FAF7F2; font-size: 14px;">${booking.check_in_date} (3:00 PM)</p>

                          <p style="margin: 0; color: #C7B9A6; font-size: 12px;">👥 <strong>Huéspedes:</strong></p>
                          <p style="margin: 4px 0; color: #FAF7F2; font-size: 14px;">${booking.guests_count} Personas</p>
                        </td>
                        <td width="50%" style="vertical-align: top;">
                          <p style="margin: 0; color: #C7B9A6; font-size: 12px;">📅 <strong>Check-Out:</strong></p>
                          <p style="margin: 4px 0 10px; color: #FAF7F2; font-size: 14px;">${booking.check_out_date} (12:30 PM)</p>

                          <p style="margin: 0; color: #C7B9A6; font-size: 12px;">🌙 <strong>Noches:</strong></p>
                          <p style="margin: 4px 0; color: #FAF7F2; font-size: 14px;">${booking.nights_count} Noche(s)</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${booking.notes ? `
                <tr>
                  <td style="padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: #FCD477; font-size: 11px; text-transform: uppercase; font-weight: bold; display: block; margin-bottom: 3px;">✨ Servicios Adicionales:</span>
                    <span style="color: #FAF7F2; font-size: 13px;">${booking.notes.replace(/^Adicionales:\s*/, '')}</span>
                  </td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>

          <!-- Financial Breakdown (50% Deposit & 50% Balance) -->
          <tr>
            <td style="padding: 10px 30px 20px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(4, 27, 28, 0.8); border: 1px solid rgba(216, 162, 50, 0.3); border-radius: 14px; padding: 18px;">
                <tr>
                  <td style="color: #C7B9A6; font-size: 13px; padding-bottom: 8px;">Total de la Estadía:</td>
                  <td align="right" style="color: #FAF7F2; font-size: 14px; font-weight: bold; padding-bottom: 8px;">${formatCOP(booking.total_amount_cop)}</td>
                </tr>
                <tr>
                  <td style="color: #87D776; font-size: 13px; padding-bottom: 8px;">
                    ✅ <strong>Anticipo 50% Pagado (Wompi):</strong>
                  </td>
                  <td align="right" style="color: #87D776; font-size: 14px; font-weight: bold; padding-bottom: 8px;">${formatCOP(booking.deposit_amount_cop)}</td>
                </tr>
                <tr>
                  <td style="color: #FCD477; font-size: 14px; font-weight: bold; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1);">
                    Saldo Pendiente al Check-In:
                  </td>
                  <td align="right" style="color: #FCD477; font-size: 16px; font-weight: bold; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-family: monospace;">
                    ${formatCOP(booking.remaining_balance_cop)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Important Rules & Inclusions -->
          <tr>
            <td style="padding: 10px 30px 25px;">
              <div style="background-color: rgba(11, 74, 75, 0.4); border-radius: 12px; padding: 16px; font-size: 12px; color: #E6DCCF; line-height: 1.6;">
                <strong style="color: #FCD477; font-size: 13px; display: block; margin-bottom: 6px;">✨ Tu Estadía Incluye:</strong>
                • Desayuno campesino para todos los huéspedes.<br>
                • Jacuzzi con hidromasaje, cine bajo las estrellas y fogata nocturna.<br>
                • Acceso completo a piscinas de roca natural, cavernas y santuario animal.<br>
                <br>
                <strong style="color: #FCD477;">🚫 Regla Importante:</strong> Prohibido el ingreso de neveras, alimentos y bebidas externas.
              </div>
            </td>
          </tr>

          <!-- Location & Support CTA -->
          <tr>
            <td style="padding: 0 30px 35px; text-align: center;">
              <a href="https://maps.google.com" style="display: inline-block; background-color: #D8A232; color: #041B1C; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 13px; text-transform: uppercase; margin: 0 5px 10px;">
                📍 Abrir en Google Maps / Waze
              </a>
              <a href="https://wa.me/573104567890" style="display: inline-block; background-color: #25D366; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-weight: bold; font-size: 13px; text-transform: uppercase; margin: 0 5px 10px;">
                💬 WhatsApp del Parque
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #031516; text-align: center; border-top: 1px solid rgba(255,255,255,0.08); font-size: 11px; color: #A4937E;">
              Andicas Bioparque Temático & Eco-Resort · Colombia<br>
              Este correo sirve como constancia oficial de tu reserva. Preséntalo en portería al llegar.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Envía el correo de confirmación de reserva
 */
export async function sendBookingConfirmationEmail(booking) {
  try {
    const htmlContent = buildVoucherHtml(booking);

    if (isRealResend && resend) {
      // En modo prueba de Resend (sin dominio verificado), Resend solo permite enviar a tu propio correo registrado
      const recipientEmail = booking.client_email;

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: [recipientEmail],
        subject: `🌿 Voucher de Reserva Confirmada: ${booking.cabin_name} (${booking.booking_reference})`,
        html: htmlContent,
      });

      if (error) {
        // Si falla por restricción de cuenta de prueba, reenviar a tu correo de prueba
        if (error.statusCode === 403 && error.message?.includes('testing emails')) {
          console.warn('⚠️ [Resend Sandbox] Reenviando al correo del propietario por restricción de pruebas de Resend...');
          const fallbackRes = await resend.emails.send({
            from: FROM_EMAIL,
            to: ['juanpabloto2000@gmail.com'],
            subject: `[Voucher Huésped: ${booking.client_name}] ${booking.cabin_name} (${booking.booking_reference})`,
            html: htmlContent,
          });
          return { success: true, fallback: true, data: fallbackRes.data };
        }

        console.error('❌ [Resend] Error enviando correo:', error);
        return { success: false, error };
      }

      console.log(`✅ [Resend] Correo de reserva enviado a ${recipientEmail} (ID: ${data.id})`);
      return { success: true, data };
    } else {
      // Modo Mock: Log visual para desarrollo
      console.log('----------------------------------------------------------------------');
      console.log(`📧 [EmailService Mock] Correo de Reserva generado con éxito para: ${booking.client_email}`);
      console.log(`📍 Referencia: ${booking.booking_reference} | Cabaña: ${booking.cabin_name}`);
      console.log(`💵 Total: $${booking.total_amount_cop} | Anticipo 50%: $${booking.deposit_amount_cop} | Saldo: $${booking.remaining_balance_cop}`);
      console.log('----------------------------------------------------------------------');
      return { success: true, mock: true };
    }
  } catch (err) {
    console.error('❌ [EmailService] Excepción al procesar correo:', err);
    return { success: false, error: err.message };
  }
}
