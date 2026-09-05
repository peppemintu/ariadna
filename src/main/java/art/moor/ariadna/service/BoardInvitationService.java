package art.moor.ariadna.service;

import art.moor.ariadna.config.security.CurrentUser;
import art.moor.ariadna.data.dto.boardUser.BoardUserResponseDto;
import art.moor.ariadna.data.dto.invitation.InvitationResponseDto;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.data.model.BoardInvitation;
import art.moor.ariadna.data.model.BoardUser;
import art.moor.ariadna.data.model.InvitationStatus;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.exception.BoardInvitationNotFoundException;
import art.moor.ariadna.exception.BoardNotFoundException;
import art.moor.ariadna.exception.InvitationAlreadyPendingException;
import art.moor.ariadna.exception.UserAlreadyMemberException;
import art.moor.ariadna.exception.UserNotFoundException;
import art.moor.ariadna.mapper.BoardInvitationMapper;
import art.moor.ariadna.mapper.BoardUserMapper;
import art.moor.ariadna.repo.BoardInvitationRepository;
import art.moor.ariadna.repo.BoardRepository;
import art.moor.ariadna.repo.BoardUserRepository;
import art.moor.ariadna.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardInvitationService {

    private final BoardInvitationRepository invitationRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final BoardUserRepository boardUserRepository;
    private final BoardInvitationMapper invitationMapper;
    private final BoardUserMapper boardUserMapper;
    private final EventPublisher eventPublisher;

    public InvitationResponseDto invite(UUID boardId, String email) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException(boardId));
        User invitedUser = userRepository.findByEmail(email)
                .orElseThrow(UserNotFoundException::new);
        User invitedBy = userRepository.findById(CurrentUser.id())
                .orElseThrow(UserNotFoundException::new);

        if (boardUserRepository.findByUserIdAndBoardId(invitedUser.getId(), boardId).isPresent()) {
            throw new UserAlreadyMemberException();
        }
        if (invitationRepository.findByBoardIdAndInvitedEmailAndStatus(boardId, email, InvitationStatus.PENDING).isPresent()) {
            throw new InvitationAlreadyPendingException();
        }

        BoardInvitation invitation = BoardInvitation.builder()
                .board(board)
                .invitedEmail(email)
                .invitedBy(invitedBy)
                .status(InvitationStatus.PENDING)
                .build();
        BoardInvitation saved = invitationRepository.save(invitation);
        InvitationResponseDto response = invitationMapper.toDto(saved);

        eventPublisher.publishInvitationEvent(email, response);

        return response;
    }

    @Transactional(readOnly = true)
    public List<InvitationResponseDto> getPendingForBoard(UUID boardId) {
        return invitationRepository.findAllByBoardIdAndStatusOrderByCreatedAtDesc(boardId, InvitationStatus.PENDING)
                .stream().map(invitationMapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<InvitationResponseDto> getMine() {
        return invitationRepository
                .findAllByInvitedEmailAndStatusOrderByCreatedAtDesc(CurrentUser.email(), InvitationStatus.PENDING)
                .stream().map(invitationMapper::toDto).toList();
    }

    public BoardUserResponseDto accept(UUID invitationId) {
        BoardInvitation invitation = getOwnPendingInvitation(invitationId);
        User user = userRepository.findById(CurrentUser.id())
                .orElseThrow(UserNotFoundException::new);

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setRespondedAt(Instant.now());

        BoardUser boardUser = BoardUser.builder().board(invitation.getBoard()).user(user).build();
        BoardUser saved = boardUserRepository.save(boardUser);

        return boardUserMapper.toDto(saved);
    }

    public void decline(UUID invitationId) {
        BoardInvitation invitation = getOwnPendingInvitation(invitationId);
        invitation.setStatus(InvitationStatus.DECLINED);
        invitation.setRespondedAt(Instant.now());
    }

    private BoardInvitation getOwnPendingInvitation(UUID id) {
        BoardInvitation invitation = invitationRepository.findById(id)
                .orElseThrow(() -> new BoardInvitationNotFoundException(id));

        if (!invitation.getInvitedEmail().equalsIgnoreCase(CurrentUser.email())
                || invitation.getStatus() != InvitationStatus.PENDING) {
            throw new AccessDeniedException("Not your invitation to respond to");
        }
        return invitation;
    }
}
