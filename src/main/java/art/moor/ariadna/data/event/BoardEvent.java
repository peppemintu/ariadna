package art.moor.ariadna.data.event;

import art.moor.ariadna.data.dto.ws.BoardMessage;

import java.util.UUID;

public record BoardEvent(
        UUID boardId,
        BoardMessage message
) {}
