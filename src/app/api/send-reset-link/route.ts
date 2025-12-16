// file: src/app/api/send-reset-link/route.ts
import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// 1. Setup Klien AWS SES
const sesClient = new SESClient({
    region: process.env.AWS_REGION, // Mengambil 'us-east-1' dari .env
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
});

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ message: 'Email is required' }, { status: 400 });
        }

        // Link Reset Password
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?email=${encodeURIComponent(email)}`;

        // 2. Siapkan Data Email
        const params = {
            Source: process.env.AWS_SOURCE_EMAIL, // Mengambil 'noreply@bukanboboiboy.online'
            Destination: {
                ToAddresses: [email],
            },
            Message: {
                Subject: {
                    Data: "Reset Password - Talent Screener",
                },
                Body: {
                    Html: {
                        Data: `
              <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #0f172a;">Reset Password Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset the password for <b>${email}</b>.</p>
                <p>Click the button below to create a new password:</p>
                <a href="${resetLink}" style="background-color: #0f172a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px; font-weight: bold;">Reset Password</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't ask for this, please ignore this email.</p>
              </div>
            `,
                    },
                    Text: {
                        Data: `Reset Password Link: ${resetLink}`,
                    },
                },
            },
        };

        // 3. Kirim via AWS SES
        const command = new SendEmailCommand(params);
        await sesClient.send(command);

        console.log(`✅ Email sent via SES to ${email}`);
        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('❌ AWS SES Error:', error);
        return NextResponse.json({ message: 'Failed to send email', error: error.message }, { status: 500 });
    }
}