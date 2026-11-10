const text = `{amount} distributed. Remaining pool: 0.00 VC.|Распределено: {amount}. Остаток копилки: 0,00 ВК.
Use at least 8 characters.|Используйте не менее 8 символов.
Use lowercase letters, numbers and underscores; start with a letter.|Используйте строчные латинские буквы, цифры и подчёркивания. Начните с буквы.
Invalid email address|Неверный адрес почты
Invalid login credentials|Неверная почта или пароль
Email not confirmed|Подтвердите почту по ссылке из письма
User already registered|Пользователь уже зарегистрирован
Choose a valid IANA timezone.|Выберите действующий часовой пояс IANA.
Choose each weekday only once.|Выберите каждый день недели только один раз.
Use a valid 24-hour deadline.|Укажите время в 24-часовом формате.
Opening time must be before the deadline on the same day.|Окно отправки должно открываться раньше срока в тот же день.
End date must be on or after the start date.|Дата окончания не может быть раньше начала.
The cap must cover at least one daily penalty.|Лимит должен покрывать хотя бы один ежедневный штраф.
Challenges can last at most 90 days.|Испытание может длиться не более 90 дней.
Choose at least one scheduled day within these dates.|Выберите хотя бы один день в указанных датах.
Grace days must be fewer than scheduled days.|Дней отдыха должно быть меньше, чем дней по расписанию.
Choose a start date from tomorrow onward in the challenge timezone.|Выберите начало не раньше завтра в часовом поясе испытания.
Paste a valid invitation code or link.|Вставьте действующий код или ссылку-приглашение.
Paste a valid invitation link or its 64-character code.|Вставьте действующую ссылку-приглашение или код из 64 символов.
Circle not found.|Круг не найден.
Only the circle owner can do this.|Это доступно только владельцу круга.
This circle is archived.|Этот круг в архиве.
You can join up to 20 circles.|Можно вступить максимум в 20 кругов.
This invitation is invalid, expired, or full.|Приглашение недействительно, просрочено или достигло лимита.
The circle or membership limit has been reached.|Достигнут лимит кругов или участников.
Resolve active challenges before archiving.|Перед архивацией завершите активные испытания.
A circle can have up to 25 open challenges.|В круге может быть до 25 открытых испытаний.
The challenge rules and roster are locked.|Правила и состав испытания закреплены.
The rules version has changed. Review it again.|Версия правил изменилась. Ознакомьтесь с ней снова.
Only the proposer or circle owner can manage this challenge.|Управлять испытанием может его автор или владелец круга.
At least two members must accept before activation.|Перед стартом нужно согласие хотя бы двух участников.
Only enrolled participants can submit their own proof.|Отправлять своё доказательство могут только участники испытания.
This submission window is closed or has not opened.|Окно отправки закрыто или ещё не открылось.
This submission window has not opened.|Окно отправки ещё не открылось.
This challenge requests camera capture.|В этом испытании требуется съёмка камерой.
Proof has already been submitted.|Доказательство уже отправлено.
Proof not found.|Доказательство не найдено.
Only the owner can submit this proof.|Отправить это доказательство может только его автор.
The deadline has passed.|Срок истёк.
Only enrolled participants can review.|Проверять могут только участники испытания.
This challenge is completed; review is closed.|Испытание завершено, проверки закрыты.
Only a decided proof can be disputed.|Оспорить можно только доказательство с принятым решением.
This proof has already had its dispute round.|Раунд спора по этому доказательству уже был.
You can appeal only your rejected proof.|Обжаловать можно только отклонение своего доказательства.
You cannot review your own proof.|Нельзя проверять своё доказательство.
This proof is not open for review.|Это доказательство не открыто для проверки.
Your vote is already recorded.|Ваш голос уже учтён.
Development mock: human review required.|Тестовый провайдер: требуется проверка людьми.
Peer quorum reached.|Достигнут кворум участников.
upload reserved|загрузка подготовлена
peer vote|голос участника
Discipline reward|Награда за дисциплину
Settlement waits for every deadline, resolved reviews and the 24-hour appeal period.|Расчёт ждёт всех сроков, завершённых проверок и 24-часового периода обжалования.
The API returned an unexpected response. Check the server connection and API routing.|Неожиданный ответ сервера. Проверьте подключение.
Unable to complete this request.|Не удалось выполнить запрос.
Something went wrong. Please try again.|Что-то пошло не так. Попробуйте снова.
Failed to fetch|Не удалось подключиться к серверу
Encouragement & conversation|Поддержка и разговор
Grace follows your accepted challenge rules: chosen dates for new challenges, earliest misses for legacy challenges. Remaining misses incur penalties up to the cap. Only accepted proof counts as success. Pending reviews and disputes block final settlement.|Отдых учитывается по принятым правилам: выбранные даты в новых испытаниях и первые пропуски в старых. За остальные пропуски начисляется виртуальный штраф в пределах лимита. В зачёт идут только принятые доказательства. Незавершённые проверки и споры блокируют итоговый расчёт.
See standings and the virtual pool for current projections.|Текущий прогноз — на странице рейтинга и копилки.
A decodable photo was received. This mock does not analyze its visual contents.|Получено читаемое фото. Тестовый провайдер не анализирует его содержимое.
Relevance to the evidence requirements has not been verified.|Соответствие требованиям к доказательству не проверено.
A photo cannot establish completion, capture time, or who performed an action.|Фото не подтверждает выполнение, время съёмки или личность того, кто выполнил действие.
This day is excused. Cancel the grace day before submitting proof.|На этот день выбран отдых. Отмените его перед отправкой доказательства.
Created the circle|Круг создан
Joined the circle|Вступил в круг
Left the circle|Покинул круг
Updated the circle|Обновил круг
Archived the circle|Круг архивирован
Reward and grace policies must match.|Правила наград и отдыха должны соответствовать друг другу.
Upload received; mock review requires independent peers.|Фото получено; после тестовой проверки нужно решение независимых участников.
Strict majority accepted the proof.|Строгое большинство приняло доказательство.
Strict majority rejected the proof.|Строгое большинство отклонило доказательство.
Discipline reward v1|Награда за дисциплину
No eligible participant: contribution refund|Нет допущенных участников: возврат взноса
01 / FIND YOUR CORNER|01 / НАЙДИТЕ СВОИХ
01 · The shared ambition|01 · Общая цель
01 — THE BEGINNING|01 — НАЧАЛО
02 / LEAVE A LITTLE EVIDENCE|02 / ПОКАЖИТЕ РЕЗУЛЬТАТ
02 · What showing up looks like|02 · Как выглядят усилия
03 / KEEP IT FRIENDLY|03 / СОХРАНИТЕ ДРУЖБУ
03 · Keep the stakes friendly|03 · Дружеский азарт
A LITTLE OFF THE PATH|СЛЕГКА СБИЛИСЬ С ПУТИ
A PROMISE WORTH KEEPING|ОБЕЩАНИЕ, КОТОРОЕ СТОИТ СДЕРЖАТЬ
A SIMPLE IDEA. A STRONGER YOU.|ПРОСТАЯ ИДЕЯ. СИЛЬНЕЕ ВЫ.
A big commitment.|Большое обещание.
A familiar face. A fresh ambition. Make yourself at home.|Знакомые лица. Новые цели. Чувствуйте себя как дома.
A little better every day. Even better together.|Каждый день немного лучше. Вместе — ещё лучше.
A little circle. Big possibilities|Небольшой круг. Большие возможности
A little commitment can change a lot. Make yours.|Маленькое обещание может многое изменить. Дайте своё.
A little momentum|Небольшой разгон
A little profile refresh.|Профиль обновлён.
A little progress. A lot of possibility.|Небольшой прогресс. Большие возможности.
A little space for a big goal.|Немного места для большой цели.
A photo. A little context. Your circle sees the effort and reviews it honestly. Progress has a paper trail.|Фото и немного контекста. Ваш круг видит усилия и честно оценивает их. У прогресса остаётся история.
A place to start|Точка старта
A plausible photo cannot prove that an action happened. Evidence is reviewed by peers. AI does not prove completion.|Правдоподобное фото не доказывает, что действие произошло. Доказательства оценивают участники. ИИ не подтверждает выполнение.
A private circle. A shared ambition. Your next small step.|Закрытый круг. Общая цель. Ваш следующий шаг.
A private corner for your people.|Закрытое пространство для ваших друзей.
A promise worth keeping|Обещание, которое стоит сдержать
A quieter kind of inbox|Спокойное место для новостей
A reason to|Причина
ACCOUNTABILITY, WITHOUT THE GUILT TRIP.|ОТВЕТСТВЕННОСТЬ БЕЗ ЧУВСТВА ВИНЫ.
ALL IN.|ВМЕСТЕ.
AND THE JUST-GETTING-STARTED|И ТЕХ, КТО ТОЛЬКО НАЧИНАЕТ
Account registration, sign-in, recovery, onboarding, profiles and a real account dashboard.|Регистрация, вход, восстановление доступа, знакомство с приложением, профили и личный обзор.
After activation|После активации
Agree on the stakes before day one. Always virtual, always transparent. No deposits or payments—just a shared promise worth keeping.|Договоритесь до старта. Всё виртуально и прозрачно. Без пополнений и платежей — только общее обещание.
An illustration of friends building consistent habits|Иллюстрация друзей, которые вместе формируют привычки
BETTER HABITS. BETTER COMPANY.|ЛУЧШЕ ПРИВЫЧКИ. ЛУЧШЕ КОМПАНИЯ.
BUILT ONE GOOD STEP AT A TIME|СОЗДАЁМ ШАГ ЗА ШАГОМ
Be the first to make the promise.|Дайте первое обещание.
Big goals.|Большие цели.
Big things start|Большое начинается
Bring your people|Пригласите своих
Built for encouragement, transparent rules, and the kind of competition that brings everyone up.|Для поддержки, прозрачных правил и соревнования, которое помогает каждому стать лучше.
CIRCLE CONTACT SHEET|ЛИЦА ВАШЕГО КРУГА
COMPANY.|КОМПАНИИ.
CONSISTENCY LOOKS GOOD ON YOU.|ПОСТОЯНСТВО ВАМ К ЛИЦУ.
Commit to something good|Пообещайте себе хорошее
Deadline reminders, circle invitations, and review updates will arrive here when notifications launch in milestone 05.|Здесь появляются напоминания о сроках, приглашения и новости проверок.
Discipline rewards · policy v1|Награды за дисциплину · правила v1
Every great streak starts with one.|Каждая большая серия начинается с одного дня.
Everything’s better with a circle.|С кругом всё лучше.
Explore your circle’s next shared promise.|Найдите следующее общее обещание вашего круга.
FOR THE EARLY RISERS|ДЛЯ ТЕХ, КТО ВСТАЁТ РАНО
Find your momentum|Найдите свой ритм
Find your people|Найдите своих
First, find the people you want to grow with.|Сначала найдите людей, с которыми хотите расти.
GOOD COMPANY. SHARED AMBITION.|ХОРОШАЯ КОМПАНИЯ. ОБЩАЯ ЦЕЛЬ.
GOOD THINGS|ХОРОШЕЕ
Good company is waiting.|Хорошая компания уже ждёт.
Good company.|Хорошая компания.
Good habits.|Хорошие привычки.
Great company.|Отличная компания.
Great momentum.|Отличный ритм.
IN GOOD|В ХОРОШЕЙ
IN THE LOOP|НА СВЯЗИ
In-app notifications, reactions, comments, recaps and final launch testing.|Уведомления, реакции, комментарии, итоги месяца и проверка перед запуском.
Just you, your people, and a promise to show up.|Вы, ваши друзья и обещание действовать.
Keep each other going|Поддерживайте друг друга
Keep the momentum|Сохраняйте ритм
Less promising.|Меньше обещаний.
Less “one day.”|Меньше «когда-нибудь».
Let’s go.|Начнём.
Let’s show up.|Давайте действовать.
Loading activity|Загрузка событий
Loading statistic|Загрузка статистики
MAKE ROOM FOR GOOD COMPANY|ПУСТИТЕ В ЖИЗНЬ ХОРОШУЮ КОМПАНИЮ
Made for your circle.|Для вашего круга.
Make a commitment, show up, and grow with friends who get it.|Дайте обещание, действуйте и растите с друзьями, которые вас понимают.
Make consistency count|Пусть постоянство приносит плоды
Make this your day one|Пусть сегодня будет первым днём
More day one.|Больше первых дней.
More doing.|Больше действий.
Motivation comes and goes.|Мотивация приходит и уходит.
No real-money stakes. No public shaming.|Без реальных ставок. Без публичного осуждения.
ONE DAY AT A TIME|ДЕНЬ ЗА ДНЁМ
One private circle. A shared ambition. Friends who notice when you show up—and help you get back to it when you don’t.|Один закрытый круг. Общая цель. Друзья, которые замечают ваши усилия и помогают вернуться, когда не получается.
Open your space|Открыть своё пространство
PEOPLE|ДРУЗЬЯ
PROGRESS IS A TEAM SPORT.|ПРОГРЕСС — КОМАНДНЫЙ СПОРТ.
Pick a goal. Agree on the rules.|Выберите цель. Договоритесь о правилах.
Private circles, invitations, challenge rules, enrollment and timezone-aware deadlines.|Закрытые круги, приглашения, правила испытаний, запись участников и сроки с учётом часовых поясов.
Private circles. Friendly stakes. Always virtual.|Закрытые круги. Дружеский азарт. Только виртуально.
Private photo evidence, honest mock review, peer review and fair disputes.|Закрытые фото, честная тестовая проверка, оценка участниками и справедливые споры.
Private spaces for friends who bring out your better.|Закрытые пространства для друзей, с которыми вы становитесь лучше.
Proof, with perspective|Доказательства с контекстом
Proportional discipline rewards · v1|Награды за дисциплину · v1
Propose your first challenge. Everyone accepts the same rules before it starts.|Предложите первое испытание. Перед стартом каждый принимает одинаковые правила.
Provisional virtual penalties, balanced ledgers, standings and exact final rewards.|Предварительные виртуальные штрафы, сбалансированный журнал, рейтинг и точные награды.
Publish clear rules, then let your people choose to join.|Опубликуйте понятные правила и дайте друзьям выбрать участие.
Read 20 pages a day|Читать 20 страниц в день
Ready for day one?|Готовы к первому дню?
SHOWED|СДЕРЖАЛИ
SMALL STEPS, RECORDED|МАЛЕНЬКИЕ ШАГИ В ИСТОРИИ
Show up.|Действуйте.
Show up. Together.|Действуйте. Вместе.
Show your effort|Покажите усилия
Showing up together|Действуем вместе
Small steps.|Маленькие шаги.
Small wins add up|Победы складываются
Social challenges are here. Here’s what works now, and what’s next.|Общие испытания уже доступны. Вот что работает сейчас и что впереди.
Stack wins.|Копите победы.
StakeUp interface error|Ошибка интерфейса StakeUp
Start a private group, invite your friends, and turn a shared ambition into a daily promise.|Создайте закрытый круг, пригласите друзей и превратите общую цель в ежедневное обещание.
TAKE TOGETHER.|ДЕЛАЕМ ВМЕСТЕ.
THE CHAPTER-A-DAY CREW|КОМАНДА «ГЛАВА В ДЕНЬ»
THE DAILY PROMISE|ЕЖЕДНЕВНОЕ ОБЕЩАНИЕ
THE FIRST STEP IS YOURS.|ПЕРВЫЙ ШАГ — ЗА ВАМИ.
THE ONE-MORE-REP PEOPLE|ТЕ, КТО ДЕЛАЮТ ЕЩЁ ПОВТОР
THE SHOW-UP EFFECT ↗|ЭФФЕКТ ДЕЙСТВИЯ ↗
THE SMALL WIN / TODAY|МАЛЕНЬКАЯ ПОБЕДА / СЕГОДНЯ
THIS IS YOUR STARTING LINE|ВАША ТОЧКА СТАРТА
TOGETHER.|ВМЕСТЕ.
The final tally|Окончательные итоги
The right nudge, when you need it.|Нужное напоминание в нужный момент.
The rules, in plain sight|Правила как на ладони
This page hasn’t found its circle.|Эта страница не нашла свой круг.
UP NEXT · MILESTONE 02|СЛЕДУЮЩИЙ ШАГ
UP ↗|ВВЕРХ ↗
VIRTUAL STAKES. REAL INTENTION.|ВИРТУАЛЬНЫЕ СТАВКИ. РЕАЛЬНОЕ НАМЕРЕНИЕ.
Virtual accounting arrives in the next milestone.|Виртуальные расчёты доступны на странице копилки.
Virtual penalties and rewards are not processed in this milestone.|Расчёты доступны на странице рейтинга и копилки.
What will you show up for|Ради чего вы будете действовать
What will you show up for?|Ради чего вы будете действовать?
You|Вы
You don’t have to be perfect. You just have to show up.|Не нужно быть идеальными. Просто действуйте.
You don’t need more willpower.|Вам не нужна сверхсила воли.
You joined StakeUp. Good things start small.|Вы присоединились к StakeUp. Хорошее начинается с малого.
You made yourself at home.|Вы освоились.
You need someone in your corner.|Вам нужен тот, кто на вашей стороне.
Your goals need a circle.|Вашим целям нужен круг.
Your people keep showing up.|Ваши друзья продолжают действовать.
You’re one small commitment away from something good.|До хорошего — одно небольшое обещание.
You’ve got the ambition. Bring the accountability.|Цель уже есть. Добавьте ответственность.
keep your word.|держать слово.
with a small promise.|с небольшого обещания.
SETTLED POOL|ИТОГОВАЯ КОПИЛКА
PROVISIONAL POOL|ПРЕДВАРИТЕЛЬНАЯ КОПИЛКА
settled|подведено
ready|готово
blocked|ожидает
accepted vote|голос за
rejected vote|голос против
Language|Язык
Overview|Обзор
My circles|Мои круги
Activity|Активность
Settings|Настройки
Notifications|Уведомления
Home|Главная
Appearance|Оформление
Accent color|Цвет акцента
Dark|Тёмная
Light|Светлая
Electric lime|Электрический лайм
Warm orange|Тёплый оранжевый
Choose your appearance and accent. Saved to your account.|Выберите тему и акцент. Настройки сохраняются в аккаунте.
YOUR SPACE|ВАШЕ ПРОСТРАНСТВО
YOUR|ВАШ
YOU|ВЫ
Your space|Ваше пространство
Your account|Ваш аккаунт
Your profile & settings|Профиль и настройки
Your profile and settings|Профиль и настройки
Your corner of StakeUp|Ваш уголок StakeUp
Personal details|Личные данные
Display name|Имя
Username|Имя пользователя
Email address|Электронная почта
EMAIL ADDRESS|ЭЛЕКТРОННАЯ ПОЧТА
Password|Пароль
Your password|Ваш пароль
At least 8 characters|Не менее 8 символов
Show password|Показать пароль
Hide password|Скрыть пароль
Save changes|Сохранить
Saving…|Сохранение…
Timezone|Часовой пояс
Your changes are saved.|Изменения сохранены.
Your personal details are up to date.|Личные данные обновлены.
Your profile is good to go.|Профиль готов.
Your profile stays within the circles you join.|Ваш профиль виден только участникам ваших кругов.
Your details aren’t public. Your circles share your display name, username and challenge participation with members. Your email stays private.|Данные профиля закрыты. Участники ваших кругов видят имя, ник и участие в испытаниях. Почта остаётся приватной.
Future deadlines will show in your preferred timezone. Each challenge keeps its own agreed timezone.|Сроки будут отображаться в выбранном часовом поясе. У каждого испытания остаётся свой согласованный часовой пояс.
Log out|Выйти
Log out of this account|Выйти из аккаунта
Signing out…|Выход…
Log in|Войти
Create account|Создать аккаунт
Create your account|Создайте аккаунт
Forgot password?|Забыли пароль?
Back to login|Назад ко входу
Back to StakeUp|На главную StakeUp
Reset your password|Сброс пароля
Update password|Обновить пароль
Send recovery link|Отправить ссылку
New around here?|Впервые здесь?
Already part of the circle?|Уже с нами?
Good to have you back.|Рады снова вас видеть.
Let’s get back to it|Продолжим
Let’s get you back in.|Вернём вам доступ.
Make a fresh start|Начните заново
A fresh start.|Новый старт.
Choose a strong, unique password for your account.|Выберите надёжный уникальный пароль.
Enter your email to receive a password recovery link.|Введите почту, чтобы получить ссылку для восстановления пароля.
Check your email to confirm your account, then sign in.|Подтвердите аккаунт по ссылке из письма, затем войдите.
If an account exists for this email, a recovery link has been created.|Если аккаунт с такой почтой существует, ссылка для восстановления отправлена.
Password updated. You can now sign in.|Пароль обновлён. Теперь можно войти.
Open a valid recovery link first.|Сначала откройте действующую ссылку для восстановления.
Open the recovery link from your email first.|Сначала откройте ссылку для восстановления из письма.
Open local recovery mailbox link ↗|Открыть локальную ссылку восстановления ↗
3–24 letters, numbers or underscores.|От 3 до 24 латинских букв, цифр или знаков подчёркивания.
Let’s make this yours.|Устройтесь поудобнее.
Finish your profile|Завершите профиль
What should your circle call you? Set up your profile and find your footing.|Как друзьям к вам обращаться? Заполните профиль и начните свой путь.
Your day one starts here.|Ваш первый день начинается здесь.
Your day one. Officially.|Ваш первый день. Всё по-настоящему.
What are you working toward?|К чему вы стремитесь?
Your kind of energy|Ваша энергия
A little about you|Немного о вас
Find your footing|Найдите свой ритм
Make yourself at home|Устраивайтесь поудобнее
Your profile is ready. Bring a circle of friends who make showing up feel good.|Профиль готов. Пригласите друзей, с которыми проще держать слово.
Your people are waiting.|Друзья вас ждут.
Profile ready. Your next chapter is waiting.|Профиль готов. Впереди новая глава.
YOUR FIRST SMALL STEP|ВАШ ПЕРВЫЙ ШАГ
YOUR NEXT CHAPTER|ВАША НОВАЯ ГЛАВА
A LITTLE MORE YOU|БОЛЬШЕ О ВАС
Initials for now. Photo uploads arrive with evidence.|Пока — инициалы. Фотографии доступны в доказательствах.
Your momentum|Ваш прогресс
Your next small win.|Ваша следующая победа.
Hey,|Привет,
Your goals. Your people. Your next small win.|Ваши цели. Ваши друзья. Ваша следующая победа.
Your people are here. Pick the next promise you’ll keep together.|Друзья уже здесь. Выберите обещание, которое сдержите вместе.
Real account activity. The beginning of your story.|Реальные события аккаунта. Начало вашей истории.
Your statistics|Ваша статистика
Active challenges|Активные испытания
Successful days|Успешные дни
Virtual prize pool|Виртуальная копилка
Virtual credits · no cash value|Виртуальные баллы · без денежной ценности
Your circles|Ваши круги
Your circle|Ваш круг
Your people. Your circles|Ваши друзья. Ваши круги
Your people, your pace|Ваши друзья, ваш темп
Your people, your promise|Ваши друзья, ваше обещание
Your shared momentum|Ваш общий прогресс
Your people.|Ваши друзья.
Your daily commitments will live here.|Здесь появятся ваши ежедневные задачи.
Today’s commitments|Задачи на сегодня
No commitments scheduled today.|На сегодня задач нет.
Recent activity|Последние события
All activity|Все события
Account activity|События аккаунта
Your first small win will appear here.|Здесь появится ваша первая маленькая победа.
Make consistency your thing|Пусть постоянство станет привычкой
Build your first private circle.|Создайте свой первый закрытый круг.
Create your first circle|Создать первый круг
Create a circle|Создать круг
Create circle|Создать круг
Explore your circles|Открыть круги
Create your account|Создайте аккаунт
Shared promises|Общие обещания
In your corner|Ваша поддержка
Circle activity|События круга
Circle name|Название круга
Description|Описание
Circle icon|Значок круга
PRIVATE CIRCLE ·|ЗАКРЫТЫЙ КРУГ ·
MEMBERS|УЧАСТНИКИ
Member|Участник
Owner|Владелец
Invite friends|Пригласить друзей
Invitation link|Ссылка-приглашение
Invitation link or code|Ссылка или код приглашения
Paste the link your friend sent|Вставьте ссылку от друга
Join circle|Вступить в круг
Joining…|Вступаем…
Creating…|Создание…
Copy|Копировать
Copied|Скопировано
Share privately. This link expires|Не публикуйте ссылку. Срок действия:
and admits up to|Максимум участников:
people.|чел.
Select the link and copy it manually.|Выделите ссылку и скопируйте вручную.
Private by default. No public directory.|Закрыто по умолчанию. Без публичного каталога.
Only people with a valid private invitation can join a Circle.|Вступить в круг можно только по действующему приглашению.
Sign in or create an account to use this invitation. We’ll keep it here while you get settled.|Войдите или создайте аккаунт, чтобы принять приглашение. Мы сохраним его для вас.
A little invitation to something good.|Небольшое приглашение к хорошему.
GOT AN INVITATION?|ВАС ПРИГЛАСИЛИ?
AN INVITATION TO SHOW UP|ПРИГЛАШЕНИЕ К ДЕЙСТВИЮ
You’ll be the owner. Invite friends with a private, expiring link.|Вы станете владельцем. Пригласите друзей по закрытой ссылке с ограниченным сроком.
Your circle is ready to grow.|Ваш круг готов расти.
What brings your people together?|Что объединяет ваших друзей?
The morning crew|Утренняя команда
Why together?|Почему вместе?
Why does this matter to your circle?|Почему это важно для вашего круга?
Make a shared promise|Дайте общее обещание
Manage circle|Управление кругом
Save circle details|Сохранить данные круга
Archive circle|Архивировать круг
Show archived circles|Показать архивные круги
Archived|В архиве
Leave circle|Покинуть круг
Active challenge participants must stay until their challenge is resolved.|Участники активного испытания остаются в круге до его завершения.
Archiving preserves history and cancels proposals. Active challenges must be resolved first.|Архивация сохраняет историю и отменяет предложения. Сначала завершите активные испытания.
New challenge|Новое испытание
Challenge title|Название испытания
Challenge dates|Даты испытания
Challenge timezone|Часовой пояс испытания
Start date|Дата начала
End date|Дата окончания
Scheduled weekdays|Дни недели
Scheduled days|Дни по расписанию
Scheduled|Запланировано
Daily upload window|Ежедневное окно отправки
Upload window opens|Начало отправки
Upload window closes|Конец отправки
Evidence requirements|Требования к доказательству
What counts as evidence|Что считается доказательством
Describe the photo and notes your circle will expect. Be honest about what a photo can and cannot show.|Опишите ожидаемые фото и пояснения. Честно укажите, что снимок может и не может подтвердить.
Allowed photo source|Источник фотографии
Camera capture only|Только камера
Camera or uploaded photo|Камера или загрузка фото
Camera or upload|Камера или загрузка
Virtual penalty per missed day|Виртуальный штраф за пропуск
Virtual penalty|Виртуальный штраф
Maximum total penalty|Максимальный общий штраф
Grace days|Дни отдыха
Per missed day|За пропуск
Your maximum|Ваш максимум
Publish proposal|Опубликовать предложение
Publishing…|Публикация…
Publishing fixes these rules. You and your friends must each accept them. Activation locks the roster and creates deadlines.|После публикации правила фиксируются. Каждый участник принимает их лично. При активации состав закрепляется и создаётся расписание.
Start tomorrow or later. Up to 90 days. On DST overlaps the later instant is used; skipped times move forward by the clock-change gap.|Начало — не раньше завтра. Длительность — до 90 дней. При переводе часов выбирается более поздний повтор времени, а пропущенное время сдвигается вперёд на величину перевода.
VC are virtual credits with no cash value. No payments are collected. Virtual accounting launches in milestone 04.|ВК — виртуальные баллы без денежной ценности. Платежей нет.
Discipline rewards · policy v2|Награды за дисциплину · правила v2
Chosen grace days are excused. Reserve them before the upload deadline. Unused days are not assigned automatically.|Выбранные дни отдыха освобождают от задания. Забронируйте их до конца окна отправки. Неиспользованные дни не назначаются автоматически.
80% completion eligibility. Rewards proportional to discipline scores. Grace days exclude the earliest misses. Remainder credits follow a deterministic tie-break.|Право на награду — от 80% выполнения. Награды пропорциональны дисциплине. Остаток распределяется по однозначному правилу.
80% completion eligibility. No real money. Grace days excuse the earliest misses; accepted days count toward your discipline score.|Право на награду — от 80% выполнения. Только виртуальные баллы. В зачёт идут принятые доказательства.
Accepting members|Набор участников
Active · rules locked|Активно · правила закреплены
Completed|Завершено
Cancelled|Отменено
Accept rules & join|Принять правила и участвовать
You accepted these rules|Вы приняли эти правила
✓ Rules accepted|✓ Правила приняты
Accepted|Приняты
Not accepted|Не приняты
Withdrew|Отказался
Withdraw before activation|Отказаться до активации
Activate & lock roster|Начать и закрепить состав
Cancel proposal|Отменить предложение
The participant list is locked.|Состав участников закреплён.
The shared promise is locked.|Общее обещание закреплено.
One shared version of the rules.|Одна версия правил для всех.
Each acceptance records this exact server-issued rule version.|Каждое согласие привязано к этой версии правил, выданной сервером.
View the immutable rule fingerprint|Показать неизменяемый отпечаток правил
I accept these dates, upload window, evidence rules, grace days, virtual penalties and cap.|Я принимаю даты, окно отправки, требования к доказательствам, дни отдыха, виртуальные штрафы и лимит.
Only members who accept will participate. Others may sit out.|Участвуют только принявшие правила. Остальные могут пропустить испытание.
At least two people must accept. Only accepted members participate; unaccepted Circle members sit out. Activation locks the rules and roster. No one can enroll or withdraw afterward.|Нужно согласие минимум двух человек. Участвуют только принявшие правила. Активация закрепляет правила и состав — после неё нельзя вступить или отказаться.
Submit & review proof|Отправить и проверить доказательства
Submit & review proof →|Отправить и проверить доказательства →
Submit photos and review evidence inside an active challenge.|Отправляйте фото и проверяйте доказательства в активном испытании.
Back to challenge|К испытанию
Back to circle|К кругу
Back to your space|В ваше пространство
Standings & virtual pool|Рейтинг и копилка
Final results|Итоги
Virtual ledger|Виртуальный журнал
Virtual credits only. No deposits, charges or withdrawals.|Только виртуальные баллы. Без пополнений, списаний и вывода денег.
Virtual credits · no cash value|Виртуальные баллы · без денежной ценности
Projected reward / refund|Ожидаемая награда / возврат
Reward / refund|Награда / возврат
Projected from resolved days. Grace days and caps applied. Review decisions can change these amounts.|Прогноз по дням с принятым решением. Учтены дни отдыха и лимиты. Новые решения могут изменить суммы.
Awaiting deadlines / reviews|Ожидание сроков / проверок
Refresh standings|Обновить рейтинг
Finalize virtual results|Подвести виртуальные итоги
Earliest settlement:|Итоги не раньше:
Settled at:|Подведены:
Rank / participant|Место / участник
Completion|Выполнение
Streak|Серия
Missed / grace|Пропуски / отдых
Eligible|Допущен
Below threshold|Ниже порога
unresolved or future days ·|непроверенных или будущих дней ·
Standings · ties share rank · eligibility requires 80% completion after grace|Рейтинг · равные результаты делят место · для награды нужно 80% выполнения с учётом отдыха
Amounts remain provisional. Final transactions appear here only when settlement completes.|Суммы предварительные. Итоговые операции появятся после окончательного расчёта.
Transaction|Операция
The rules behind the numbers.|Как устроены расчёты.
Eligible participants split the pool in proportion to exact discipline scores. Fractions are rounded down, then remaining minor units follow largest fractional remainder, with participant UUID as the tie-break. If nobody qualifies, contributions are refunded. A zero pool pays zero.|Копилка делится пропорционально точным показателям дисциплины. Сначала доли округляются вниз, остаток достаётся наибольшим дробным остаткам. При равенстве порядок определяет UUID участника. Если никто не допущен, взносы возвращаются. Пустая копилка ничего не выплачивает.
Finalization waits for all deadlines, resolved reviews and at least 24 hours since the latest review event or final deadline. Scheduled processing checks every five minutes when available. Final settlement locks further reviews and releases active participation restrictions.|Расчёт ждёт всех сроков, завершённых проверок и минимум 24 часов после последней проверки или крайнего срока. Планировщик проверяет готовность каждые пять минут. После расчёта проверки закрываются, ограничения активного участия снимаются.
Earliest missed days use grace first. Remaining misses incur the daily penalty up to the accepted cap. Only accepted proof counts as success. Pending reviews and disputes block final settlement.|В старой версии правил отдых покрывает первые пропуски. За остальные начисляется виртуальный штраф в пределах лимита. В зачёт идут только принятые доказательства. Незаконченные проверки и споры блокируют итоговый расчёт.
SHOW THE EFFORT. KEEP THE CONTEXT.|ПОКАЖИТЕ УСИЛИЯ. СОХРАНИТЕ КОНТЕКСТ.
DISCIPLINE HAS A PAPER TRAIL|У ДИСЦИПЛИНЫ ЕСТЬ ИСТОРИЯ
A little proof.|Немного доказательств.
A little effort belongs here.|Вашим усилиям здесь место.
Your submission windows|Ваши окна отправки
Your frozen schedule|Ваше закреплённое расписание
Server-generated deadlines follow|Сервер рассчитывает сроки по
. Your timestamps are fixed across clock changes.|. Сроки зафиксированы с учётом перевода часов.
No submission window is open right now. Check the schedule below.|Сейчас окно отправки закрыто. Расписание — ниже.
Your proof for today has been submitted.|Доказательство за сегодня отправлено.
Submit private proof|Отправить закрытое доказательство
Take a photo|Сделать фото
Choose photo|Выбрать фото
Context for your circle|Пояснение для круга
What did you do? What can this photo show?|Что вы сделали? Что может показать это фото?
Your selected proof preview|Предпросмотр выбранного фото
Preparing proof…|Подготовка фото…
Photo received. Your proof is ready for peer review.|Фото получено. Доказательство готово к проверке участниками.
Photos are private to your Circle. GPS metadata is removed. Camera capture is a requested source, not proof of when a photo was taken. JPEG, PNG and WebP are supported; photos are resized before upload.|Фото доступны только вашему кругу. Данные GPS удаляются. Камера — выбранный источник, но не подтверждение времени съёмки. Поддерживаются JPEG, PNG и WebP; перед загрузкой фото уменьшаются.
Use JPEG, PNG or WebP.|Используйте JPEG, PNG или WebP.
Choose a photo smaller than 20 MB.|Выберите фото размером меньше 20 МБ.
Unable to load this private photo.|Не удалось загрузить закрытое фото.
Opens|Открывается
· Submit by|· Отправить до
· deadline|· срок
Window closed|Окно закрыто
Expired — no proof|Просрочено — фото нет
Upload incomplete|Загрузка не завершена
Development review · human judgment needed|Тестовая проверка · нужно решение людей
AI never decides completion. Decisions require a strict majority of eligible peers. Rejection and dispute resolution need at least two independent reviewers. If your Circle is too small, review stays unresolved; no penalty is finalized.|ИИ не определяет выполнение. Нужно строгое большинство допущенных участников. Для отклонения и разрешения спора нужны минимум два независимых проверяющих. Если круг слишком мал, проверка остаётся открытой, окончательный штраф не начисляется.
Your Circle’s submitted photos and review history will appear here.|Здесь появятся фотографии круга и история проверок.
Your review|Ваша проверка
What did you observe? Explain your decision.|Что вы увидели? Объясните решение.
Endorse proof|Подтвердить
Flag as invalid|Указать нарушение
Explain the dispute|Объясните возражение
Appeal this rejection|Обжаловать отклонение
Dispute the decision|Оспорить решение
Open dispute|Открыть спор
Review history ·|История проверок ·
(round|(раунд
pending|ожидает
ai reviewed|проверено тестовым ИИ
accepted|принято
rejected|отклонено
disputed|оспаривается
expired|просрочено
reserved|подготовлено
submitted|отправлено
grace|отдых
penalty|штраф
reward|награда
refund|возврат
YOUR CIRCLE, IN THE LOOP|ВАШ КРУГ НА СВЯЗИ
A little nudge|Небольшое напоминание
Deadlines, decisions and the moments worth noticing.|Сроки, решения и важные моменты.
Mark all as read|Прочитать всё
Mark as read|Прочитано
You’re all caught up.|Вы всё прочитали.
Reminders and circle updates will appear here.|Здесь появятся напоминания и новости круга.
Open update →|Открыть событие →
Circle update|Новость круга
Your upload window closes soon|Окно отправки скоро закроется
A submission deadline has passed|Срок отправки истёк
Your circle needs a review|Кругу нужна ваша проверка
Your proof was accepted|Ваше доказательство принято
Your proof was rejected|Ваше доказательство отклонено
A proof decision was disputed|Решение по доказательству оспорено
Your challenge is active|Испытание началось
Your challenge is complete|Испытание завершено
A new challenge is ready to join|Открыт набор в новое испытание
Someone commented on your proof|Кто-то прокомментировал ваше доказательство
Your grace day is reserved|День отдыха забронирован
Your monthly recap|Ваши итоги месяца
Encourage|Поддержать
Celebrate|Отметить успех
Support|Поставить сердце
Encouragement never counts as a review vote.|Реакции не считаются голосами при проверке.
Circle conversation ·|Разговор круга ·
Comment removed|Комментарий удалён
Remove my comment|Удалить мой комментарий
Add encouragement|Добавить поддержку
Post comment|Отправить комментарий
Make room for a rest day.|Выделите время для отдыха.
This challenge keeps its accepted automatic grace policy. Choose grace dates in a new challenge.|В этом испытании действуют принятые правила автоматического отдыха. Выбрать даты можно в новом испытании.
Choose a scheduled day before its upload deadline. Chosen days are excused and excluded from your score denominator. Unused grace days are not assigned automatically.|Выберите день из расписания до конца окна отправки. В этот день задание не требуется, и он исключается из расчёта дисциплины. Неиспользованный отдых не назначается автоматически.
grace days remaining|дней отдыха осталось
Choose or change a grace day|Выбрать или изменить день отдыха
Cancel grace day|Отменить отдых
Use grace day|Выбрать для отдыха
Excused|День отдыха
YOUR EFFORT ADDS UP|ВАШИ УСИЛИЯ СКЛАДЫВАЮТСЯ
A record of showing up.|История ваших усилий.
accepted proofs ·|принятых доказательств ·
submissions ·|отправок ·
completed challenges|завершённых испытаний
Your first accepted proof starts your achievement history.|Первое принятое доказательство откроет вашу историю достижений.
First proof accepted|Первое доказательство принято
Seven small wins|Семь маленьких побед
Thirty times showing up|Тридцать дней усилий
First challenge completed|Первое испытание завершено
You showed up. Together.|Вы справились. Вместе.
Your challenge is complete. Every virtual credit is accounted for.|Испытание завершено. Каждый виртуальный балл учтён.
Try again|Повторить
One moment…|Один момент…
Getting things ready…|Всё подготавливаем…
We couldn’t connect.|Не удалось подключиться.
Let’s take a quick breather.|Сделаем небольшой перерыв.
Reload StakeUp|Перезагрузить StakeUp
We couldn’t load this page. Reload to try again.|Не удалось загрузить страницу. Обновите её и попробуйте снова.
Skip to content|Перейти к содержимому
Main navigation|Основная навигация
Mobile navigation|Мобильная навигация
StakeUp home|Главная StakeUp
Your circle stays private.|Ваш круг остаётся закрытым.
All stakes are virtual. Your circle stays private.|Все ставки виртуальные. Ваш круг остаётся закрытым.
All stakes are virtual. Always.|Все ставки виртуальные. Всегда.
All stakes are virtual. There are no payment details to add.|Все ставки виртуальные. Платёжные данные не нужны.
VIRTUAL STAKES ONLY|ТОЛЬКО ВИРТУАЛЬНЫЕ СТАВКИ
StakeUp · All stakes are virtual.|StakeUp · Все ставки виртуальные.
LOCAL DEV|ЛОКАЛЬНАЯ РАЗРАБОТКА
Local development account|Локальный тестовый аккаунт
Local development · data stays on this computer|Локальная разработка · данные остаются на этом компьютере
Supabase authenticated|Вход через Supabase
Better, together.|Вместе — лучше.
A little accountability.|Немного ответственности.
A lot of possibility.|Много возможностей.
A little accountability. A lot of possibility.|Немного ответственности. Много возможностей.
The road ahead|Что впереди
The idea|Идея
See what’s coming|Что будет дальше
Clear rules. Friendly stakes. No real money.|Ясные правила. Дружеский азарт. Без реальных денег.
Mon|Пн
Tue|Вт
Wed|Ср
Thu|Чт
Fri|Пт
Sat|Сб
Sun|Вс
days|дней
challenges|испытаний
events|событий
optional|необязательно
accepted ·|приняли ·
accepted /|принято /
per missed day|за пропуск
at midnight|в полночь
in your device timezone. Server receipt time is authoritative.|в часовом поясе устройства. Учитывается время получения сервером.
VC|ВК
Flame · consistency|Пламя · постоянство
Sprout · growth|Росток · развитие
Dumbbell · movement|Гантель · движение
Book · learning|Книга · учёба
Sun · fresh starts|Солнце · новые начала
Please sign in to continue.|Войдите, чтобы продолжить.
Email or password is incorrect.|Неверная почта или пароль.
An account with this email or username already exists.|Аккаунт с такой почтой или именем уже существует.
That username is already taken.|Это имя уже занято.
Challenge not found.|Испытание не найдено.
Only enrolled participants can choose their own grace days.|Выбирать свои дни отдыха могут только участники испытания.
This challenge uses its original automatic grace policy.|В этом испытании действуют исходные правила автоматического отдыха.
Choose or cancel a grace day before its upload deadline.|Выберите или отмените день отдыха до конца окна отправки.
Proof is already submitted for this day.|Доказательство за этот день уже отправлено.
Your grace-day allowance is used up.|Все дни отдыха уже выбраны.
Submitted proof not found.|Отправленное доказательство не найдено.
Only your own comments can be removed.|Удалять можно только свои комментарии.
This day is reserved as a grace day. Cancel it before submitting proof.|На этот день выбран отдых. Отмените его перед отправкой доказательства.`;
export const ru: Record<string, string> = Object.fromEntries(
  text.split('\n').map((line) => {
    const separator = line.indexOf('|');
    return [line.slice(0, separator), line.slice(separator + 1)];
  }),
);
