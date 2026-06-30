package art.moor.ariadna.repo;

import art.moor.ariadna.data.model.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityRepository extends JpaRepository<Activity, UUID> {
    List<Activity> findByBoardIdOrderByCreatedAtDesc(UUID boardId);
}
