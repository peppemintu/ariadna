package art.moor.ariadna.service;

import art.moor.ariadna.data.dto.activity.ActivityResponseDto;
import art.moor.ariadna.mapper.ActivityMapper;
import art.moor.ariadna.repo.ActivityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final ActivityMapper activityMapper;

    public List<ActivityResponseDto> getByBoard(UUID boardId) {
        return activityRepository.findByBoardIdOrderByCreatedAtDesc(boardId)
                .stream().map(activityMapper::toDto).toList();
    }
}
