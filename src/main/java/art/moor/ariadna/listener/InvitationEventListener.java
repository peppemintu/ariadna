package art.moor.ariadna.listener;

import art.moor.ariadna.data.event.InvitationEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class InvitationEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @TransactionalEventListener
    public void onInvitationEvent(InvitationEvent event) {
        messagingTemplate.convertAndSendToUser(
                event.invitedEmail(),
                "/queue/notifications",
                event.invitation()
        );
    }

}
