package art.moor.ariadna.service;

import art.moor.ariadna.data.dto.card.CardCreateDto;
import art.moor.ariadna.data.dto.card.CardMoveDto;
import art.moor.ariadna.data.dto.card.CardResponseDto;
import art.moor.ariadna.data.dto.card.CardUpdateDto;
import art.moor.ariadna.data.model.ActionType;
import art.moor.ariadna.exception.BoardColumnNotFoundException;
import art.moor.ariadna.exception.BoardUserNotFoundException;
import art.moor.ariadna.exception.CardNotFoundException;
import art.moor.ariadna.mapper.CardMapper;
import art.moor.ariadna.data.model.BoardColumn;
import art.moor.ariadna.data.model.BoardUser;
import art.moor.ariadna.data.model.Card;
import art.moor.ariadna.repo.BoardColumnRepository;
import art.moor.ariadna.repo.BoardUserRepository;
import art.moor.ariadna.repo.CardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Transactional
public class CardService {

    static final double POSITION_STEP = 1000.0;

    private final CardRepository cardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final BoardUserRepository boardUserRepository;
    private final CardMapper cardMapper;

    private final EventPublisher eventPublisher;

    public CardResponseDto create(UUID columnId, CardCreateDto dto) {
        BoardColumn column = boardColumnRepository.findById(columnId)
                .orElseThrow(() -> new BoardColumnNotFoundException(columnId));
        double maxPos = cardRepository.findMaxPositionByColumnId(columnId).orElse(0.0);

        UUID boardId = column.getBoard().getId();

        Card card = cardMapper.fromCreate(dto);
        card.setBoard(column.getBoard());
        card.setColumn(column);
        card.setPosition(maxPos + POSITION_STEP);
        if (dto.assigneeId() != null) {
            card.setAssignee(resolveAssignee(dto.assigneeId(), boardId));
        }
        Card savedCard = cardRepository.save(card);
        CardResponseDto response = cardMapper.toDto(savedCard);

        eventPublisher.publishActivityEvent(
                boardId,
                savedCard.getId(),
                null,
                ActionType.CARD_CREATED,
                Map.of("title", savedCard.getTitle())
        );
        eventPublisher.publishBoardEvent(
                boardId,
                ActionType.CARD_CREATED,
                response
        );

        return response;
    }

    @Transactional(readOnly = true)
    public CardResponseDto getById(UUID id) {
        return cardMapper.toDto(getCard(id));
    }

    @Transactional(readOnly = true)
    public List<CardResponseDto> getByColumn(UUID columnId) {
        return cardRepository.findByColumnIdOrderByPositionAscIdAsc(columnId)
                .stream().map(cardMapper::toDto).toList();
    }

    public CardResponseDto update(UUID id, CardUpdateDto dto) {
        Card card = getCard(id);

        if (card.getVersion() != dto.version()) {
            throw new ObjectOptimisticLockingFailureException(Card.class, id);
        }

        cardMapper.updateEntity(dto, card);
        Card savedCard = cardRepository.saveAndFlush(card);
        CardResponseDto response = cardMapper.toDto(savedCard);
        UUID boardId = savedCard.getBoard().getId();

        eventPublisher.publishActivityEvent(
                boardId,
                savedCard.getId(),
                null,
                ActionType.CARD_UPDATED,
                Map.of("title", savedCard.getTitle())
        );
        eventPublisher.publishBoardEvent(
                boardId,
                ActionType.CARD_UPDATED,
                response
        );

        return response;
    }

    public CardResponseDto assign(UUID id, UUID assigneeId) {
        Card card = getCard(id);
        card.setAssignee(
                assigneeId == null ? null : resolveAssignee(assigneeId, card.getBoard().getId())
        );

        Card savedCard = cardRepository.saveAndFlush(card);
        CardResponseDto response = cardMapper.toDto(savedCard);
        UUID boardId = savedCard.getBoard().getId();

        eventPublisher.publishActivityEvent(
                boardId,
                savedCard.getId(),
                null, // userId — добавишь когда будет auth
                ActionType.CARD_ASSIGNED,
                Map.of("title", savedCard.getTitle())
        );
        eventPublisher.publishBoardEvent(
                boardId,
                ActionType.CARD_ASSIGNED,
                response
        );

        return response;
    }

    public void delete(UUID id) {
        Card card = getCard(id);
        UUID boardId = card.getBoard().getId();

        cardRepository.delete(card);

        eventPublisher.publishActivityEvent(
                boardId,
                card.getId(),
                null, // userId — добавишь когда будет auth
                ActionType.CARD_DELETED,
                Map.of("title", card.getTitle())
        );
        eventPublisher.publishBoardEvent(
                boardId,
                ActionType.CARD_DELETED,
                Map.of("id", id)
        );
    }

    public CardResponseDto move(UUID id, CardMoveDto cardMoveDto) {
        Card card = getCard(id);

        if (card.getVersion() != cardMoveDto.version()) {
            throw new ObjectOptimisticLockingFailureException(Card.class, id);
        }

        UUID targetColumnId = cardMoveDto.targetColumnId();
        BoardColumn targetColumn = boardColumnRepository.findById(targetColumnId)
                .orElseThrow(() -> new BoardColumnNotFoundException(targetColumnId));

        if (!targetColumn.getBoard().getId().equals(card.getBoard().getId())) {
            throw new IllegalArgumentException("Cannot move a card to a different board");
        }

        double newPosition = computePosition(targetColumnId, cardMoveDto.prevCardId(), cardMoveDto.nextCardId());

        card.setColumn(targetColumn);
        card.setPosition(newPosition);

        Card savedCard = cardRepository.saveAndFlush(card);
        CardResponseDto response = cardMapper.toDto(savedCard);
        UUID boardId = savedCard.getBoard().getId();

        eventPublisher.publishActivityEvent(
                boardId,
                savedCard.getId(),
                null,
                ActionType.CARD_MOVED,
                Map.of("title", savedCard.getTitle(), "toColumnId", targetColumn.getId().toString())
        );
        eventPublisher.publishBoardEvent(
                boardId,
                ActionType.CARD_MOVED,
                response
        );

        return response;
    }

    private Card getCard(UUID id) {
        return cardRepository.findById(id)
                .orElseThrow(() -> new CardNotFoundException(id));
    }

    private BoardUser resolveAssignee(UUID assigneeId, UUID boardId) {
        return boardUserRepository.findByIdAndBoardId(assigneeId, boardId)
                .orElseThrow(() -> new BoardUserNotFoundException(assigneeId));
    }

    private double computePosition(UUID targetColumnId, UUID prevCardId, UUID nextCardId) {
        Double prev = prevCardId == null ? null : getCardInColumn(prevCardId, targetColumnId).getPosition();
        Double next = nextCardId == null ? null : getCardInColumn(nextCardId, targetColumnId).getPosition();
        return midpoint(prev, next);
    }

    static double midpoint(Double prev, Double next) {
        if (prev != null && next != null) return (prev + next) / 2.0;
        if (prev == null && next != null) return next / 2.0;
        if (prev != null) return prev + POSITION_STEP;
        return POSITION_STEP;
    }

    private Card getCardInColumn(UUID cardId, UUID columnId) {
        Card card = getCard(cardId);
        if (!card.getColumn().getId().equals(columnId)) {
            throw new IllegalArgumentException("Neighbor " + cardId + " is not in column " + columnId);
        }
        return card;
    }

}