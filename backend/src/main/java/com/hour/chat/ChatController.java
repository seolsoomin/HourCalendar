package com.hour.chat;

import com.hour.auth.LoginUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rooms/{roomId}/messages")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping
    public ChatDto.Page messages(@AuthenticationPrincipal LoginUser user,
                                 @PathVariable Long roomId,
                                 @RequestParam(required = false) Long before,
                                 @RequestParam(required = false) Long after) {
        return chatService.getMessages(user.userId(), roomId, before, after);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChatDto.Message send(@AuthenticationPrincipal LoginUser user,
                                @PathVariable Long roomId,
                                @Valid @RequestBody ChatDto.Send req) {
        return chatService.send(user.userId(), roomId, req.content());
    }

    @PostMapping("/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void read(@AuthenticationPrincipal LoginUser user,
                     @PathVariable Long roomId,
                     @Valid @RequestBody ChatDto.Read req) {
        chatService.markRead(user.userId(), roomId, req.messageId());
    }
}
