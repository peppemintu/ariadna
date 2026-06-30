package art.moor.ariadna.repo;

import art.moor.ariadna.data.model.BoardColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BoardColumnRepository extends JpaRepository<BoardColumn, UUID> {
    List<BoardColumn> findByBoardIdOrderByPositionAsc(UUID boardId);

    @Query("SELECT MAX(c.position) FROM BoardColumn c WHERE c.board.id = :boardId")
    Optional<Double> findMaxPositionByBoardId(@Param("boardId") UUID boardId);
}