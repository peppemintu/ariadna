package art.moor.ariadna.service;

import art.moor.ariadna.data.dto.board.BoardRequestDto;
import art.moor.ariadna.data.dto.board.BoardResponseDto;
import art.moor.ariadna.exception.BoardNotFoundException;
import art.moor.ariadna.mapper.BoardMapper;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.repo.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardService {
    private final BoardRepository boardRepository;
    private final BoardMapper boardMapper;

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
