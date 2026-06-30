package art.moor.ariadna.listener;

import art.moor.ariadna.data.event.BoardEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class BoardEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @TransactionalEventListener
    public void onBoardEvent(BoardEvent event) {
        messagingTemplate.convertAndSend(
                "/topic/board/" + event.boardId(),
                event.message()
        );
    }

}
