package art.moor.ariadna.service;

import art.moor.ariadna.data.model.BoardPermission;
import art.moor.ariadna.repo.BoardRepository;
import art.moor.ariadna.repo.BoardUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoardAccessService implements BoardAccess {

    private final BoardUserRepository boardUserRepository;
    private final BoardRepository boardRepository;

    @Override
    public boolean isMember(UUID userId, UUID boardId) {
        return boardUserRepository.findByUserIdAndBoardId(userId, boardId).isPresent();
    }

    @Override
    public boolean isOwner(UUID userId, UUID boardId) {
        return boardRepository.findById(boardId)
                .map(board -> board.getOwner().getId().equals(userId))
                .orElse(false);
    }

    @Override
    public boolean hasPermission(UUID userId, UUID boardId, BoardPermission permission) {
        if (isOwner(userId, boardId)) {
            return true;
        }
        return boardUserRepository.findByUserIdAndBoardId(userId, boardId)
                .map(boardUser -> boardUser.getPermissions().contains(permission))
                .orElse(false);
    }
}
