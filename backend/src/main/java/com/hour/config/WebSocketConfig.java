package com.hour.config;

import com.hour.chat.RoomSubscriptionInterceptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    public static final String ENDPOINT = "/api/ws";

    private final RoomSubscriptionInterceptor roomSubscriptionInterceptor;
    private final String[] allowedOrigins;
    private TaskScheduler messageBrokerTaskScheduler;

    public WebSocketConfig(RoomSubscriptionInterceptor roomSubscriptionInterceptor,
                           @Value("${hour.allowed-origins:http://localhost:3000}") String[] allowedOrigins) {
        this.roomSubscriptionInterceptor = roomSubscriptionInterceptor;
        this.allowedOrigins = allowedOrigins;
    }

    @Autowired
    public void setMessageBrokerTaskScheduler(@Lazy @Qualifier("messageBrokerTaskScheduler") TaskScheduler scheduler) {
        this.messageBrokerTaskScheduler = scheduler;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint(ENDPOINT).setAllowedOriginPatterns(allowedOrigins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[] {10_000, 10_000})
                .setTaskScheduler(messageBrokerTaskScheduler);
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(roomSubscriptionInterceptor);
    }
}
