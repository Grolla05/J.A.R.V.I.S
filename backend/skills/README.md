# 📘 Guia de Desenvolvimento de Skills (J.A.R.V.I.S.)

O J.A.R.V.I.S. utiliza um sistema de **Carregamento Dinâmico de Skills**. Isso significa que você não precisa mais editar o `brain.py` manualmente para adicionar novas funcionalidades. Basta criar um arquivo na pasta de skills seguindo o contrato padrão.

---

## 🏗️ Arquitetura de Uma Skill

Para adicionar um novo "poder", você só precisa seguir um passo: **Criar o arquivo da Skill**.

### O Contrato da Skill

Todo arquivo dentro de `backend/skills/` (ou subpastas) será carregado se possuir:

1. `INTENT`: Uma string única identificando a ação.
2. `execute(entity)`: Uma função que recebe o alvo da ação e retorna uma string (o que o JARVIS deve falar).
3. `PROMPT_TEXT`: (Opcional) Uma descrição para ajudar a IA a entender quando usar essa skill.

---

## 📂 Exemplo Prático: Skill de Controle de Apps

Crie o arquivo `backend/skills/automation/app_control.py`:

```python
from core import log

# 1. Identificador único da intenção
INTENT = "OPEN_APP"

# 2. Descrição para o "Cérebro" da IA
PROMPT_TEXT = "- OPEN_APP: O usuário quer abrir um software. O campo 'entity' é o nome do app."

# 3. Lógica de execução
def execute(entity):
    if not entity:
        return "Não entendi qual programa você quer abrir."

    try:
        # Lógica para abrir o app (ex: os.startfile)
        log.info(f"Executando abertura de: {entity}")
        return f"Abrindo {entity} agora, senhor."
    except Exception as e:
        return f"Houve um erro ao tentar abrir o software: {e}"
```

---

## 🧠 Como o Cérebro Aprende

O `skill_loader.py` dentro do `core` faz o seguinte:

1. Varre recursivamente a pasta `skills/`.
2. Importa cada arquivo `.py`.
3. Extrai o `PROMPT_TEXT` e injeta no motor de decisão da IA.
4. Mapeia o `INTENT` diretamente para a função `execute`.

---

## ✅ Checklist de Criação

1. [ ] Criou o arquivo `.py` dentro de `backend/skills/`?
2. [ ] Definiu a variável `INTENT` com um nome único?
3. [ ] Escreveu a função `execute(entity)` retornando uma string?
4. [ ] Adicionou o `PROMPT_TEXT` para a IA saber quando te chamar?
5. [ ] Utiliza `from core import log` para manter o rastreio?

---

## 💡 Dicas de Desenvolvimento

- **Subpastas:** Você pode organizar suas skills em subpastas como `/web`, `/system`, `/iot`. O carregador as encontrará automaticamente.
- **Performance:** Evite importações pesadas no topo do arquivo se elas forem usadas apenas dentro do `execute`.
- **Segurança:** Sempre valide a `entity` recebida antes de passar para comandos de sistema ou subprocessos.
