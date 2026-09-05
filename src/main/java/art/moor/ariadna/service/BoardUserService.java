package art.moor.ariadna.service;

import art.moor.ariadna.config.security.BoardAccessGuard;
import art.moor.ariadna.data.dto.boardUser.BoardUserResponseDto;
import art.moor.ariadna.data.model.BoardPermission;
import art.moor.ariadna.data.model.BoardUser;
import art.moor.ariadna.exception.BoardUserNotFoundException;
import art.moor.ariadna.mapper.BoardUserMapper;
import art.moor.ariadna.repo.BoardUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Membership is keyed by its own id here, not the board's, so protection is a
 * BoardAccessGuard call after loading the row rather than a controller
 * @PreAuthorize — see BoardService's class doc for the general split. On top of
 * the plain MANAGE_MEMBERS check there's a rule that doesn't fit BoardPermission
 * at all: the owner can never be touched, and only the owner (not another
 * manager) may change or remove a manager.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BoardUserService {

    private final BoardUserRepository boardUserRepository;
    private final BoardUserMapper boardUserMapper;
    private final BoardAccessGuard boardAccessGuard;

    public BoardUserResponseDto updatePermissions(UUID boardUserId, Set<BoardPermission> permissions) {
        BoardUser target = getBoardUser(boardUserId);
        UUID boardId = target.getBoard().getId();

        requireOwnerUntouchedAndManagerRule(target, boardId);

        target.setPermissions(new HashSet<>(permissions));
        return boardUserMapper.toDto(target);
    }

    public void remove(UUID boardUserId) {
        BoardUser target = getBoardUser(boardUserId);
        UUID boardId = target.getBoard().getId();

        requireOwnerUntouchedAndManagerRule(target, boardId);

        boardUserRepository.deleteById(boardUserId);
    }

    private void requireOwnerUntouchedAndManagerRule(BoardUser target, UUID boardId) {
        if (target.getUser().getId().equals(target.getBoard().getOwner().getId())) {
            throw new AccessDeniedException("The board owner's membership can't be changed");
        }

        boardAccessGuard.requirePermission(boardId, BoardPermission.MANAGE_MEMBERS);

        boolean targetIsManager = target.getPermissions().contains(BoardPermission.MANAGE_MEMBERS);
        if (targetIsManager) {
            boardAccessGuard.requireOwner(boardId);
        }
    }

    private BoardUser getBoardUser(UUID id) {
        return boardUserRepository.findById(id)
                .orElseThrow(() -> new BoardUserNotFoundException(id));
    }
}
