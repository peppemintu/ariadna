package art.moor.ariadna.mapper;

import art.moor.ariadna.data.dto.activity.ActivityResponseDto;
import art.moor.ariadna.data.model.Activity;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ActivityMapper {
    ActivityResponseDto toDto(Activity activity);
}
