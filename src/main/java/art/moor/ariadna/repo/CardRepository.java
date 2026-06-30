package art.moor.ariadna.repo;

import art.moor.ariadna.data.model.Card;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CardRepository extends JpaRepository<Card, UUID> {
    List<Card> findByColumnIdOrderByPositionAscIdAsc(UUID columnId);

    @Query("SELECT MAX(c.position) FROM Card c WHERE c.column.id = :columnId")
    Optional<Double> findMaxPositionByColumnId(@Param("columnId") UUID columnId);
}