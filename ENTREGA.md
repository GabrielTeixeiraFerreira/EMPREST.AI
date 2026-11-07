# Entrega da prática

## Links

- Repositório (turma REST: back e front): https://github.com/GabrielTeixeiraFerreira/EMPREST.AI e https://github.com/GabrielTeixeiraFerreira/EMPREST.AI-Back
- Produção (Vercel): https://emprest-ai.vercel.app e https://emprestaiback.vercel.app

Este arquivo foi preparado sem criar commit ou tag. A entrega somente inclui
o conteúdo commitado antes da tag `entrega-pratica`.

## 1. Conflitos: o que foi pedido contra o que já existia

| pedido                                               | contrariava o quê                                                                        | o que você fez                                                                                                                           | por quê                                                                                         | onde ficou registrado                                                                                                                        | commit                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Exibir crédito da foto na tela                       | A spec de empréstimo exige catálogo sem rodapé ou crédito                                | O frontend não exibe o crédito; a divergência com a skill permaneceu                                                                     | As duas fontes ficaram em conflito e não houve decisão final registrada                         | `docs/specs/solicitar-emprestimo.md:9,35`; `skills/imagens-equipamentos/SKILL.md:37,68`; `docs/handoff/2026-11-07-pixabay-storage-deploy.md` | `c0146a4` / `f5eff09`                                 |
| Colocar imagens no Storage automaticamente           | A spec de migration deixa upload fora do escopo, embora skill e pipeline possam publicar | As 12 imagens foram enviadas ao bucket, verificadas por `HeadObject` e tiveram URLs públicas HTTP 200; o upload não foi commitado no Git | Assets não geram migration Prisma; publicação é etapa protegida e separada                      | `rules/migration.md:41-58`; `docs/handoff/2026-11-07-equipment-images-migration.md`; `docs/handoff/2026-11-07-pixabay-storage-deploy.md`     | sem commit; `2bdd97f` referencia os assets no backend |
| Declarar a prática concluída sem todas as validações | Havia bloqueios de seed, Vercel, shadow database e auditoria crítica                     | Mantivemos ressalvas nos pontos sem evidência final                                                                                      | Handoffs posteriores registram builds/testes aprovados, mas não todas as validações de produção | `tasks/equipment-images-migration.md`; `tasks/dados-iniciais-producao.md`; `docs/handoff/2026-11-07-solicitar-emprestimo.md`                 | sem commit                                            |

## 1b. Lacunas: o que foi pedido de forma incompleta

| spec                         | o que faltava                                           | alternativas                                                               | o que decidiu                                                          | por quê                                                                                                   | commit                                                                                               |
| ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `equipment-images-migration` | Onde guardar e publicar fotos                           | Storage automático junto da migration, upload protegido ou arquivos locais | Referenciar basename no backend e publicar em etapa separada protegida | Assets não pertencem à migration; o pipeline valida antes do upload                                       | `docs/specs/equipment-images-migration.md:9-12,30`; `rules/migration.md:41-58`; handoff de migration |
| `dados-iniciais-producao`    | Como provar dimensões, créditos e hashes                | Manifesto, inspeção manual ou prova por URL                                | Usar manifesto e validar 12 arquivos em `800x600`                      | O handoff registrou `images=12`, `credits=12`, `invalid_dimensions=0`, `uniqueIds=12` e `uniqueHashes=12` | `docs/specs/dados-iniciais-producao.md:47-55`; handoff Pixabay                                       |
| `solicitar-emprestimo`       | Como conciliar crédito obrigatório e ausência de rodapé | Exibir crédito, omitir crédito ou alterar spec                             | Mantivemos a implementação sem crédito e registramos a divergência     | A auditoria deve decidir a regra antes de declarar a spec pronta                                          | `docs/specs/solicitar-emprestimo.md:9,35`; handoff de empréstimo                                     |

## 2. Onde o agente tentou decidir por você

O backend trata `imagePath` como basename e monta a URL fixa
`/images/equipamentos/`, embora a spec descreva caminhos públicos. A suposição
aparece em `EMPREST.AI-Back/src/modules/equipment/equipment.service.ts:41-45`
e foi introduzida no commit `2bdd97f`. O handoff posterior confirma que esse
caminho foi usado nos 12 uploads e nas URLs públicas HTTP 200, mas a decisão
de arquitetura não foi registrada em ADR.

## 3. Uma decisão que merece (ou não) um ADR

A separação entre schema e assets merece ADR se for mantida: a alternativa
seria colocar upload junto da migration, mas `rules/migration.md:41-58`
define etapa separada por pipeline protegido. Ainda não virou ADR porque o
fluxo depende de secrets protegidos, rotação de credenciais e validação
pós-upload; por enquanto a decisão está na rule e nos handoffs.

## 4. A skill imagens-equipamentos

- O `SKILL.md` concentra regras, procedimento, manifesto e checklist
  (`skills/imagens-equipamentos/SKILL.md:7-99`). O histórico registra 12 fotos
  e `manifesto-creditos.json` em `EMPREST.AI/public/images/equipamentos`; não
  registra `references/` nem script versionado de processamento
  (`docs/handoff/2026-11-07-pixabay-storage-deploy.md`).
- O schema, seed e serviço garantem referência e URL; dimensões, IDs, hashes,
  créditos e upload dependem da skill, validação e pipeline. O handoff registra
  12 imagens válidas, 12 créditos, dimensões corretas, IDs e hashes únicos.
- Não existe bloqueio técnico contra produção. A proteção é operacional:
  secrets somente no provedor, validações antes do upload, bucket conferido e
  verificação pública após o upload (`rules/migration.md:41-58`). O handoff
  registra os 12 uploads e 12 URLs HTTP 200.
- Fotos reprovadas: **não há contagem registrada**. Há prova das 12 aceitas,
  mas não do número de candidatos rejeitados.

## 5. O subagente verificador

- É acionado após as tasks de uma spec ou quando solicitado
  (`agents/spec-verifier.md:3`).
- Lê spec, plano, tasks, código e artefatos para conferir cada `CA-xx` sem
  herdar conclusões anteriores (`agents/spec-verifier.md:12-17,26-33`).
- Não edita arquivos (`agents/spec-verifier.md:33`).
- O caso é back/front. O handoff de empréstimos registra auditoria
  independente `INCONCLUSIVA` por falta de testes de sucesso, limite, atraso,
  concorrência e isolamento (`docs/handoff/2026-11-07-solicitar-emprestimo.md`).

## 6. O verificador em ação

Houve uma auditoria independente da spec de empréstimos, cujo resultado foi
`INCONCLUSIVA` pelas lacunas de testes registradas no handoff. Não há histórico
de erro plantado nem os dois commits exigidos para essa prova.

Tabela final da spec `equipment-images-migration`:

| CA    | estado                | evidência                                                                                                       |
| ----- | --------------------- | --------------------------------------------------------------------------------------------------------------- |
| CA-01 | Atendido              | `prisma/schema.prisma:62`; migration `20261106110000`                                                           |
| CA-02 | Atendido no código    | seed e migration registram `TI-0001` a `TI-0012`                                                                |
| CA-03 | Atendido por schema   | `imagePath` é opcional                                                                                          |
| CA-04 | Bloqueado             | shadow database não possui `auth`; `migrate deploy` passou no banco autorizado                                  |
| CA-05 | Atendido com ressalva | `db:validate`, `db:generate` e build passaram; teste falhou inicialmente e depois foi registrado como corrigido |

Tabela final da spec `dados-iniciais-producao`:

| CA    | estado                              | evidência                                                                                        |
| ----- | ----------------------------------- | ------------------------------------------------------------------------------------------------ |
| CA-01 | Atendido no seed                    | estados e patrimônios estão definidos                                                            |
| CA-02 | Atendido no histórico de deploy     | 12 imagens `800x600`, publicadas e HTTP 200                                                      |
| CA-03 | Sem evidência                       | seed implementado, mas execução de produção não foi validada nesta sessão                        |
| CA-04 | Sem evidência de execução           | `upsert` é idempotente, mas a carga duas vezes continua bloqueada                                |
| CA-05 | Atendido no histórico de preparação | manifesto com créditos, IDs e hashes                                                             |
| CA-06 | Atendido com ressalva               | validação, testes, build e diff check passaram no handoff; carga de produção permanece bloqueada |

## 7. Uma regra sua que esta prática pôs à prova

A regra de não declarar uma spec pronta quando há CA sem evidência, bloqueado
ou não atendido (`rules/check.md:11-20`) foi mantida. Os handoffs mostraram
que upload, build e teste aprovado em etapas específicas não substituem a
prova do seed em ambiente autorizado nem os testes críticos da auditoria.

## 8. O que ficou de fora e o que faria diferente

Ficaram pendentes a validação de
“Fotos: Pixabay” na tela, a execução repetida do seed, a confirmação final do
Vercel e os testes críticos da spec de empréstimo. O histórico registra o
upload e a validação dos assets, mas essas evidências não correspondem a um
commit da entrega. Também foi registrado que credenciais de Storage foram
expostas e precisam ser rotacionadas antes de novo upload.

Eu faria primeiro uma spec única do contrato de imagens, depois manifesto,
verificador com erro plantado e só então publicação.
