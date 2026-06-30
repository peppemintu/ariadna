package art.moor.ariadna.data.dto.ws;

import art.moor.ariadna.data.model.ActionType;

public record BoardMessage (
        ActionType type,
        Object payload
) {}
