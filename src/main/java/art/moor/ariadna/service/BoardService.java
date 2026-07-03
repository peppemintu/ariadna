package art.moor.ariadna.service;

import art.moor.ariadna.data.dto.board.BoardFullDto;
import art.moor.ariadna.data.dto.board.BoardRequestDto;
import art.moor.ariadna.data.dto.board.BoardResponseDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnWithCardsDto;
import art.moor.ariadna.data.dto.card.CardResponseDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;
import art.moor.ariadna.data.model.BoardUser;
import art.moor.ariadna.exception.BoardNotFoundException;
import art.moor.ariadna.mapper.BoardColumnMapper;
import art.moor.ariadna.mapper.BoardMapper;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.mapper.CardMapper;
import art.moor.ariadna.mapper.UserMapper;
import art.moor.ariadna.repo.BoardColumnRepository;
import art.moor.ariadna.repo.BoardRepository;
import art.moor.ariadna.repo.CardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {
    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final CardRepository cardRepository;
    private final BoardMapper boardMapper;
    private final UserMapper userMapper;
    private final CardMapper cardMapper;
    private final BoardColumnMapper boardColumnMapper;

    public BoardResponseDto createBoard(BoardRequestDto board) {
        return boardMapper.toDto(
                boardRepository.save(boardMapper.fromDto(board))
        );
    }

    @Transactional(readOnly = true)
    public BoardResponseDto getById(UUID id) {
        return boardMapper.toDto(getBoard(id));
    }

    @Transactional(readOnly = true)
    public BoardFullDto getFullBoardById(UUID boardId) {
        Board board = getBoard(boardId);

        List<UserResponseDto> members = board.getBoardUsers().stream()
                .map(BoardUser::getUser).map(userMapper::toDto).toList();

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

        return boardMapper.toFullBoard(board, members, columns);
    }

    @Transactional(readOnly = true)
    public List<BoardResponseDto> getAll() {
        return boardRepository.findAll().stream()
                .map(boardMapper::toDto)
                .toList();
    }

    public BoardResponseDto update(UUID id, BoardRequestDto editedBoard) {
        Board board = getBoard(id);
        boardMapper.updateEntity(editedBoard, board);
        return boardMapper.toDto(board);
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
}
