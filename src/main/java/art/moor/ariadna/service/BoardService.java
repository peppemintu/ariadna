package art.moor.ariadna.service;

import art.moor.ariadna.config.security.CurrentUser;
import art.moor.ariadna.data.dto.board.BoardFullDto;
import art.moor.ariadna.data.dto.board.BoardMyAccessDto;
import art.moor.ariadna.data.dto.board.BoardRequestDto;
import art.moor.ariadna.data.dto.board.BoardResponseDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnWithCardsDto;
import art.moor.ariadna.data.dto.boardUser.BoardMemberDto;
import art.moor.ariadna.data.dto.card.CardResponseDto;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.data.model.BoardPermission;
import art.moor.ariadna.data.model.BoardUser;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.exception.BoardNotFoundException;
import art.moor.ariadna.exception.UserNotFoundException;
import art.moor.ariadna.mapper.BoardColumnMapper;
import art.moor.ariadna.mapper.BoardMapper;
import art.moor.ariadna.mapper.BoardUserMapper;
import art.moor.ariadna.mapper.CardMapper;
import art.moor.ariadna.repo.BoardColumnRepository;
import art.moor.ariadna.repo.BoardRepository;
import art.moor.ariadna.repo.BoardUserRepository;
import art.moor.ariadna.repo.CardRepository;
import art.moor.ariadna.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Board-rooted endpoints (boardId directly in the URL) are protected
 * declaratively on the controller via {@code @PreAuthorize(hasPermission(...))}
 * — see BoardController — so this service assumes the caller is already
 * authorized and focuses on the business logic. Nested resources (columns,
 * cards) can't do that (their id, not the board's, is in the path), so those
 * services call BoardAccessGuard directly after loading the entity.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {
    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final CardRepository cardRepository;
    private final UserRepository userRepository;
    private final BoardUserRepository boardUserRepository;
    private final BoardAccess boardAccess;
    private final BoardMapper boardMapper;
    private final BoardUserMapper boardUserMapper;
    private final CardMapper cardMapper;
    private final BoardColumnMapper boardColumnMapper;

    public BoardResponseDto createBoard(BoardRequestDto request) {
        User owner = userRepository.findById(CurrentUser.id())
                .orElseThrow(UserNotFoundException::new);

        Board board = boardMapper.fromDto(request);
        board.setOwner(owner);
        Board savedBoard = boardRepository.save(board);

        // No permission rows for the owner — their rights come from Board.owner,
        // never from stored permissions (see BoardAccessService.hasPermission).
        boardUserRepository.save(BoardUser.builder().board(savedBoard).user(owner).build());

        return boardMapper.toDto(savedBoard, myAccess(savedBoard.getId()));
    }

    @Transactional(readOnly = true)
    public BoardResponseDto getById(UUID id) {
        return boardMapper.toDto(getBoard(id), myAccess(id));
    }

    @Transactional(readOnly = true)
    public BoardFullDto getFullBoardById(UUID boardId) {
        Board board = getBoard(boardId);

        List<BoardMemberDto> members = board.getBoardUsers().stream()
                .map(boardUserMapper::toMemberDto).toList();

        Map<UUID, List<CardResponseDto>> cardsByColumn = cardRepository
                .findByBoardIdOrderByPositionAscIdAsc(boardId).stream()
                .collect(Collectors.groupingBy(
                        card -> card.getColumn().getId(),
                        Collectors.mapping(cardMapper::toDto, Collectors.toList())
                ));

        List<BoardColumnWithCardsDto> columns = boardColumnRepository
                .findByBoardIdOrderByPositionAsc(boardId).stream()
                .map(column -> boardColumnMapper.toDto(
                        column, cardsByColumn.getOrDefault(column.getId(), List.of())
                ))
                .toList();

        return boardMapper.toFullBoard(board, myAccess(boardId), members, columns);
    }

    @Transactional(readOnly = true)
    public List<BoardResponseDto> getAll() {
        UUID userId = CurrentUser.id();
        return boardUserRepository.findAllByUserId(userId).stream()
                .map(BoardUser::getBoard)
                .map(board -> boardMapper.toDto(board, myAccess(board.getId(), userId)))
                .toList();
    }

    public BoardResponseDto update(UUID id, BoardRequestDto editedBoard) {
        Board board = getBoard(id);
        boardMapper.updateEntity(editedBoard, board);
        return boardMapper.toDto(board, myAccess(id));
    }

    public void delete(UUID id) {
        if (!boardRepository.existsById(id)) {
            throw new BoardNotFoundException(id);
        }
        boardRepository.deleteById(id);
    }

    private Board getBoard(UUID id) {
        return boardRepository.findById(id)
                .orElseThrow(() -> new BoardNotFoundException(id));
    }

    private BoardMyAccessDto myAccess(UUID boardId) {
        return myAccess(boardId, CurrentUser.id());
    }

    private BoardMyAccessDto myAccess(UUID boardId, UUID userId) {
        boolean owner = boardAccess.isOwner(userId, boardId);
        Set<BoardPermission> permissions = owner
                ? EnumSet.allOf(BoardPermission.class)
                : boardUserRepository.findByUserIdAndBoardId(userId, boardId)
                        .map(BoardUser::getPermissions)
                        .orElse(Set.of());
        return new BoardMyAccessDto(owner, permissions);
    }
}
