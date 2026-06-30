package art.moor.ariadna.service;

import art.moor.ariadna.data.dto.ws.BoardMessage;
import art.moor.ariadna.data.event.ActivityEvent;
import art.moor.ariadna.data.event.BoardEvent;
import art.moor.ariadna.data.model.ActionType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventPublisher {
    private final ApplicationEventPublisher eventPublisher;

    public void publishBoardEvent(UUID boardId, ActionType action, Object changedObject) {
        eventPublisher.publishEvent(new BoardEvent(
                boardId,
                new BoardMessage(action, changedObject)
        ));
    }

    public void publishActivityEvent(
            UUID boardId,
            UUID itemId,
            UUID userId,
            ActionType action,
            Map<String, Object> payload
    ) {
        eventPublisher.publishEvent(new ActivityEvent(
                boardId,
                itemId,
                userId,
                action,
                payload
        ));
    }
}
