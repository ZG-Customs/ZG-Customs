package hr.fer.zgcustoms.servicecatalog;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceTypeRepository extends JpaRepository<ServiceType, Long> {
    List<ServiceType> findAllByOrderByIdAsc();
}
