package hr.fer.zgcustoms.servicecatalog;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/service-types")
public class ServiceTypeController {
    private final ServiceTypeRepository repository;

    public ServiceTypeController(ServiceTypeRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<ServiceTypeResponse> list() {
        return repository.findAllByOrderByIdAsc().stream()
                .map(type -> new ServiceTypeResponse(type.getId(), type.getCode(),
                        type.getName(), type.getDescription()))
                .toList();
    }

    public record ServiceTypeResponse(Long id, String code, String name, String description) {}
}
