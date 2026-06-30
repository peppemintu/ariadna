package art.moor.ariadna.service;

import art.moor.ariadna.data.dto.user.UserCreateRequestDto;
import art.moor.ariadna.data.dto.user.UserResponseDto;
import art.moor.ariadna.data.dto.user.UserUpdateRequestDto;
import art.moor.ariadna.exception.UserNotFoundException;
import art.moor.ariadna.mapper.UserMapper;
import art.moor.ariadna.data.model.User;
import art.moor.ariadna.data.model.UserRole;
import art.moor.ariadna.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserResponseDto createUser(UserCreateRequestDto newUser) {
        User user = userMapper.fromCreate(newUser);
        user.setPasswordHash(passwordEncoder.encode(newUser.password()));
        return userMapper.toDto(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponseDto getById(UUID id) {
        return userMapper.toDto(getUser(id));
    }

    @Transactional(readOnly = true)
    public List<UserResponseDto> getAll() {
        return userRepository.findAll().stream()
                .map(userMapper::toDto)
                .toList();
    }

    public UserResponseDto update(UUID id, UserUpdateRequestDto editedUser) {
        User user = getUser(id);
        userMapper.updateEntity(editedUser, user);
        return userMapper.toDto(user);
    }

    public UserResponseDto updateRole(UUID id, UserRole role) {
        User user = getUser(id);
        user.setRole(role);
        return userMapper.toDto(user);
    }

    public void delete(UUID id) {
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
    }

    private User getUser(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException(id));
    }
}
