package art.moor.ariadna.repo;

import art.moor.ariadna.data.model.BoardUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardUserRepository extends JpaRepository<BoardUser, UUID> {
    Optional<BoardUser> findByUserIdAndBoardId(UUID id, UUID boardId);
}