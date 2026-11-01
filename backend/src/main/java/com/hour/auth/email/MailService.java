package com.hour.auth.email;

import com.hour.common.ApiException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${spring.mail.username:}")
    private String from;

    public void sendCode(String to, EmailPurpose purpose, String code) {
        JavaMailSender sender = mailSenderProvider.getIfAvailable();
        if (sender == null) {
            log.warn("[개발용] spring.mail 설정이 없어 메일을 보내지 않았습니다. {} / {} 인증번호: {}",
                    to, purpose.getLabel(), code);
            return;
        }

        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(from, "HOUR");
            helper.setTo(to);
            helper.setSubject("[HOUR] " + purpose.getLabel() + " 인증번호");
            helper.setText(body(purpose, code), true);
            sender.send(message);
        } catch (Exception e) {
            log.error("인증 메일 발송 실패: {}", to, e);
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "인증 메일을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.");
        }
    }

    private static String body(EmailPurpose purpose, String code) {
        return """
                <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px;border:1px solid #ddd">
                  <h2 style="margin:0 0 16px">HOUR %s</h2>
                  <p>아래 인증번호를 HOUR 화면에 입력해 주세요.</p>
                  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">%s</p>
                  <p style="color:#888;font-size:13px">인증번호는 10분 동안만 사용할 수 있습니다.<br>
                  직접 요청하지 않았다면 이 메일은 무시하셔도 됩니다.</p>
                </div>
                """.formatted(purpose.getLabel(), code);
    }
}
