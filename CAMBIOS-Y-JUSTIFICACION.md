# Cambios realizados y su justificación

**Cultural Inglesa de Oxford — Sistema de gestión académica**

Este documento resume los cambios de la última etapa de desarrollo y los justifica con tres fuentes:

- **Preparación del proyecto** (`PreparacionProyecto-Tedesco.docx`): funcionalidades, reglas de negocio (RN), validaciones, usuarios y estados definidos originalmente.
- **Auditoría Fase 1** (`auditoria-fase1.md`): brechas detectadas entre lo pensado y lo implementado.
- **Plan Fase 2** (`fase2-plan.md`): plan para cerrar esas brechas.

Hay cambios que cubren brechas de la auditoría y cambios nuevos pedidos durante la revisión. Los segundos están marcados como **ampliación**. No figuran en el documento de preparación y se justifican por el pedido del cliente y por su coherencia con las reglas existentes.

---

## 1. Reglas de negocio y estados de inscripción

| Cambio | Justificación |
|---|---|
| **Cierre automático del ciclo lectivo.** Al vencer `fechaFin`, las inscripciones pasan a `FINALIZADA`. También se puede iniciar o finalizar el ciclo a mano. | Preparación, estados: *"Finalizada: el período lectivo ha terminado y el alumno ha cerrado su cursada"*. La auditoría marcó que `EN_CURSO` y `FINALIZADA` solo cambiaban a mano (sección 2e). Ahora la transición es automática. |
| **Porcentaje de asistencia** sobre el total de clases del ciclo (25 por defecto). Con menos de 70% el alumno queda desaprobado por faltas. Es visible para el docente. | Plan Paso 3d y auditoría 3.4: la asistencia existía en el backend sin cálculo ni UI. Es una **ampliación** pedida por el cliente. Se agregó el campo `desaprobadoPorFaltas` para que `FINALIZADA` refleje "aprobando o reprobando" (preparación). |
| **No se puede tomar asistencia a alumnos con matrícula pendiente.** La asistencia se guarda una sola vez por fecha. | Evita datos inconsistentes: un alumno `PENDIENTE` todavía no tiene plaza asegurada (preparación, estado *Pendiente*). |
| **El docente solo ve alumnos con matrícula al día** (`CONFIRMADA`, `EN_CURSO` o `FINALIZADA`) y no puede calificar a quien adeuda. | Preparación, estado *Confirmada*: *"se registró el pago de la matrícula y la plaza está asegurada"*. Quien no pagó no está realmente inscripto. Refuerza RN-03, que limita la carga de notas a docentes y administración. |
| **Un alumno no puede cursar más de un curso activo a la vez.** | **Ampliación.** Complementa RN-01 (cupos) y RN-02 (correlatividad) y evita inscripciones superpuestas. |
| **Renovación de año sobre la misma inscripción.** La inscripción vuelve a `PENDIENTE` y reinicia asistencia y notas. El período anterior se guarda en `historial`. | **Ampliación.** Evita filas duplicadas del mismo alumno. Mantiene RN-02: la correlatividad también considera el `historial` (nivel aprobado en períodos previos). La matrícula se vuelve a cobrar. Queda `PENDIENTE` porque el estado *Pendiente* se define por la falta de pago de matrícula. |
| **Solo el admin o el propio alumno pueden renovar** (`ForbiddenError`). | RN-03 y roles de la preparación: cada rol opera solo sobre lo que le corresponde. |

## 2. Interfaz de administración

| Cambio | Justificación |
|---|---|
| **Filtro por estado** en Inscripciones, con contadores. | Auditoría 2e: la máquina de estados estaba *"completamente invisible"* en el frontend. Plan 5c pedía la tabla de inscripciones con estado. El filtro permite ver cancelados, en curso, etc. |
| **Drawer de detalle** al tocar cualquier fila (inscripción, alumno, profesor, curso). | Preparación, administrador: *"gestionar toda la información de la academia"*. Se corrigió que tocar un usuario no hacía nada. |
| **Drawer de alumno:** datos personales, estado de pagos, inscripciones e historial de pagos. | Preparación, alumno: *"historial de pagos pendientes"*. Auditoría 3.7 y 2b: no había vista de pagos. |
| **Fechas del ciclo detrás de un botón** que abre un drawer, con botones para iniciar o finalizar el ciclo. | Pedido del cliente. Mantiene la tabla limpia y concentra la gestión del ciclo en un solo lugar. |
| **Paleta unificada** (verde oscuro, azul marino y beige). Se quitaron naranja, violeta y verdes chillones. El rojo queda solo para reprobados. | Coherencia con la estética del sitio. Los estados siguen distinguiéndose con la paleta contenida. |
| **Tablas más anchas** y sin saltos de línea. Se quitaron los banners de bienvenida. | Legibilidad de los datos. Los banners no aportaban información. |

## 3. Pagos a docentes (ampliación)

| Cambio | Justificación |
|---|---|
| Nueva colección `pagosDocentes` y endpoint `POST /teacher-payments`, solo para admin. Hay un pago por docente y por mes (`AAAA-MM`). Cada docente ve únicamente los suyos. | Pedido del cliente: registrar que se les pagó a los docentes y controlarlo cada mes. Extiende el rol de administración (*"registrar los pagos de cuotas por ventanilla"*) al lado de egresos. |
| Panel **"Control de pagos a docentes"** del mes en curso, con botón de pago por docente. | Es la verificación mensual pedida. Es manual: el panel lista pendientes al entrar a la pestaña, y no envía avisos automáticos. |
| Drawer de profesor con datos personales, cursos, pago del mes e historial. | Un solo lugar con toda la información del docente. |

Los pagos a docentes no figuran en la preparación ni en el plan, y el monto se escribe al pagar.

## 4. Portal del alumno y del docente

| Cambio | Justificación |
|---|---|
| El alumno ve su porcentaje de asistencia con el umbral de 70%. Puede renovar su inscripción y solicitar un nuevo curso solo si no tiene uno activo. | Preparación, alumno: *"inscribirse a nuevos cursos habilitados para su nivel"*. Plan 5e. |
| El docente ve el porcentaje de cada alumno para detectar ausentismo. La asistencia en lote solo aplica a alumnos habilitados. | Plan 5d (UI de asistencia). Se suma el seguimiento de faltas. |

## 5. Formulario de contacto

| Cambio | Justificación |
|---|---|
| El aviso de "consulta enviada" ya no muestra el email del destinatario. | Pedido del cliente: ese dato no debe exponerse al usuario. |
| El éxito se muestra solo si el servicio de mail lo confirma. Si no, la consulta igual queda guardada en el backend y se ve en el panel de administración (`/contacto`). | Auditoría 1.2 y plan 3g: el contacto debe persistirse. Así no se pierde ninguna consulta. |
| **Causa de que no llegaran los mails:** FormSubmit exige activar el destino con un enlace enviado por mail (comprobado con una consulta de prueba). El destino pasó a `aabyted@gmail.com` porque el mail del colegio podía filtrar el mensaje de activación. | Falta que el cliente haga clic en el enlace "Activate Form" que llega a esa casilla. |

## 6. Repositorio

| Cambio | Justificación |
|---|---|
| `.gitignore` en la raíz (`node_modules/`, `dist/`, `.env*`, logs). Se sacaron del índice `frontend/node_modules` y `frontend/dist`. | Estaban versionados (más de 5000 archivos) porque el único `.gitignore` estaba en `backend`. No se borraron del disco. |

---

## 7. Trazabilidad con la auditoría

| Brecha de la auditoría | Estado tras estos cambios |
|---|---|
| UI de estados de inscripción invisible (2e) | Resuelta: badges por estado, filtro y drawer. |
| Transiciones `EN_CURSO` y `FINALIZADA` solo manuales | Resuelta: cierre automático por fecha, más control manual. |
| `passed` no se persistía (RN-02) | Se persiste, y la correlatividad también lee el `historial` de períodos anteriores. |
| Historial de pagos del alumno sin UI | Resuelta: se ve en el drawer del alumno. |
| UI de asistencia del docente | Resuelta, con porcentaje y umbral de 70%. |
| Contacto sin persistencia real | Resuelta: se guarda en el backend y se envía por mail cuando el servicio está activado. |

Quedan fuera de este documento las brechas de otras etapas (test nivelador, hash de contraseñas, RN-05, CRUD de cursos). El resto del plan de la Fase 2 ya estaba implementado.

## 8. Pendientes y decisiones abiertas

- Activar FormSubmit con el enlace enviado a `aabyted@gmail.com`.
- Definir si la renovación debe dejar la inscripción en `PENDIENTE` (actual, exige cobrar matrícula) o directamente activa.
- Definir si los docentes tendrán un sueldo mensual fijo guardado, o si se sigue ingresando el monto al pagar.
- El aviso mensual de pagos a docentes es un panel y no una notificación automática.
