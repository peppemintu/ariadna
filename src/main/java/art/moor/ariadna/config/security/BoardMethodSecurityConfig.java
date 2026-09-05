package art.moor.ariadna.config.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.expression.method.MethodSecurityExpressionHandler;

@Configuration
public class BoardMethodSecurityConfig {

    // static: method-security infrastructure beans are created very early,
    // before this configuration class itself would otherwise be initialized.
    @Bean
    static MethodSecurityExpressionHandler methodSecurityExpressionHandler(BoardPermissionEvaluator boardPermissionEvaluator) {
        DefaultMethodSecurityExpressionHandler handler = new DefaultMethodSecurityExpressionHandler();
        handler.setPermissionEvaluator(boardPermissionEvaluator);
        return handler;
    }
}
