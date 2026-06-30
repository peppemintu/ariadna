package art.moor.ariadna.controller;

import art.moor.ariadna.data.dto.activity.ActivityResponseDto;
import art.moor.ariadna.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/api/board/{boardId}/activity")
    public List<ActivityResponseDto> getByBoard(@PathVariable UUID boardId) {
        return activityService.getByBoard(boardId);
    }

}
