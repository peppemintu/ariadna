package art.moor.ariadna.service;

import art.moor.ariadna.data.dto.boardColumn.BoardColumnCreateDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnResponseDto;
import art.moor.ariadna.data.dto.boardColumn.BoardColumnUpdateDto;
import art.moor.ariadna.data.model.ActionType;
import art.moor.ariadna.exception.BoardColumnNotFoundException;
import art.moor.ariadna.exception.BoardNotFoundException;
import art.moor.ariadna.mapper.BoardColumnMapper;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.data.model.BoardColumn;
import art.moor.ariadna.data.model.Card;
import art.moor.ariadna.repo.BoardColumnRepository;
import art.moor.ariadna.repo.BoardRepository;
import art.moor.ariadna.repo.CardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardColumnService {

    private static final double POSITION_STEP = 1.0;

    private final BoardColumnRepository boardColumnRepository;
    private final BoardRepository boardRepository;
    private final CardRepository cardRepository;
    private final BoardColumnMapper boardColumnMapper;

    private final EventPublisher eventPublisher;

    public BoardColumnResponseDto create(UUID boardId, BoardColumnCreateDto dto) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException(boardId));
        double maxPos = boardColumnRepository.findMaxPositionByBoardId(boardId).orElse(0.0);
        BoardColumn column = boardColumnMapper.fromCreate(dto);
        column.setBoard(board);
        column.setPosition(maxPos + POSITION_STEP);

        BoardColumn savedColumn = boardColumnRepository.save(column);
        BoardColumnResponseDto response = boardColumnMapper.toDto(savedColumn);

        eventPublisher.publishActivityEvent(
                boardId,
                savedColumn.getId(),
                null,
                ActionType.COLUMN_CREATED,
                Map.of("title", savedColumn.getTitle())
        );
        eventPublisher.publishBoardEvent(
                boardId,
                ActionType.COLUMN_CREATED,
                response
        );

        return response;
    }

    @Transactional(readOnly = true)
    public BoardColumnResponseDto getById(UUID id) {
        return boardColumnMapper.toDto(getColumn(id));
    }

    @Transactional(readOnly = true)
    public List<BoardColumnResponseDto> getByBoard(UUID boardId) {
        return boardColumnRepository.findByBoardIdOrderByPositionAsc(boardId)
                .stream().map(boardColumnMapper::toDto).toList();
    }

    public BoardColumnResponseDto update(UUID id, BoardColumnUpdateDto dto) {
        BoardColumn column = getColumn(id);
        boardColumnMapper.updateEntity(dto, column);
        BoardColumn savedColumn = boardColumnRepository.save(column);
        BoardColumnResponseDto response = boardColumnMapper.toDto(savedColumn);
        UUID boardId = savedColumn.getBoard().getId();

        eventPublisher.publishActivityEvent(
                boardId,
                savedColumn.getId(),
                null,
                ActionType.COLUMN_UPDATED,
                Map.of("title", savedColumn.getTitle())
        );
        eventPublisher.publishBoardEvent(
                boardId,
                ActionType.COLUMN_UPDATED,
                response
        );

        return response;
    }

    public void delete(UUID id) {
        BoardColumn column = getColumn(id);
        UUID boardId = column.getBoard().getId();

        //IdAsc для того, если два пользователя перетаскивают две разные карточки на одну позицию - тайбрейкер
        List<Card> cards = cardRepository.findByColumnIdOrderByPositionAscIdAsc(id);
        cardRepository.deleteAll(cards);
        boardColumnRepository.delete(column);

        eventPublisher.publishActivityEvent(
                boardId,
                column.getId(),
                null,
                ActionType.COLUMN_DELETED,
                Map.of("title", column.getTitle())
        );
        eventPublisher.publishBoardEvent(
                boardId,
                ActionType.COLUMN_DELETED,
                Map.of("id", id)
        );
    }

    private BoardColumn getColumn(UUID id) {
        return boardColumnRepository.findById(id)
                .orElseThrow(() -> new BoardColumnNotFoundException(id));
    }
}
