package art.moor.ariadna.repo;

import art.moor.ariadna.data.model.BoardInvitation;
import art.moor.ariadna.data.model.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BoardInvitationRepository extends JpaRepository<BoardInvitation, UUID> {
    List<BoardInvitation> findAllByBoardIdAndStatusOrderByCreatedAtDesc(UUID boardId, InvitationStatus status);

    List<BoardInvitation> findAllByInvitedEmailAndStatusOrderByCreatedAtDesc(String invitedEmail, InvitationStatus status);

    Optional<BoardInvitation> findByBoardIdAndInvitedEmailAndStatus(UUID boardId, String invitedEmail, InvitationStatus status);
}
