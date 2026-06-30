package art.moor.ariadna.listener;

import art.moor.ariadna.data.event.ActivityEvent;
import art.moor.ariadna.data.model.Activity;
import art.moor.ariadna.repo.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class ActivityEventListener {

    private final ActivityRepository activityRepository;

    @Async
    @TransactionalEventListener
    public void handle(ActivityEvent event) {
        try {
            Activity activity = new Activity();
            activity.setBoardId(event.boardId());
            activity.setTargetItemId(event.targetItemId());
            activity.setUserId(event.userId());
            activity.setActionType(event.actionType());
            activity.setPayload(event.payload());
            activityRepository.save(activity);
        } catch (Exception e) {
            log.error("Failed to save activity: action={}, board={}",
                    event.actionType(), event.boardId(), e);
        }
    }

}
