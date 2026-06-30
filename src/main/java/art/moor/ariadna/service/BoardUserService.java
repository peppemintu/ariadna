package art.moor.ariadna.service;

import art.moor.ariadna.data.dto.board.BoardResponseDto;
import art.moor.ariadna.data.dto.boardUser.BoardUserResponseDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;
import art.moor.ariadna.exception.BoardNotFoundException;
import art.moor.ariadna.exception.BoardUserNotFoundException;
import art.moor.ariadna.exception.UserNotFoundException;
import art.moor.ariadna.mapper.BoardMapper;
import art.moor.ariadna.mapper.BoardUserMapper;
import art.moor.ariadna.mapper.UserMapper;
import art.moor.ariadna.data.model.Board;
import art.moor.ariadna.data.model.BoardUser;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.repo.BoardRepository;
import art.moor.ariadna.repo.BoardUserRepository;
import art.moor.ariadna.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardUserService {
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final BoardUserRepository boardUserRepository;
    private final BoardUserMapper boardUserMapper;
    private final UserMapper userMapper;
    private final BoardMapper boardMapper;

    public BoardUserResponseDto addUserToBoard(UUID boardId, UUID userId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException(boardId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        BoardUser boardUser = BoardUser.builder()
                .board(board)
                .user(user)
                .build();

        return boardUserMapper.toDto(boardUserRepository.save(boardUser));
    }

    @Transactional(readOnly = true)
    public List<UserResponseDto> getAllUsersByBoard(UUID boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new BoardNotFoundException(boardId));

        return board.getBoardUsers()
                .stream()
                .map(BoardUser::getUser)
                .map(userMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BoardResponseDto> getAllBoardsByUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        return user.getBoardUsers()
                .stream()
                .map(BoardUser::getBoard)
                .map(boardMapper::toDto)
                .toList();
    }

    public void delete(UUID id) {
        if (!boardUserRepository.existsById(id)) {
            throw new BoardUserNotFoundException(id);
        }
        boardUserRepository.deleteById(id);
    }
}
