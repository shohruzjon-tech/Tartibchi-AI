import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Telegraf } from 'telegraf';
import {
  SERVICES,
  TENANT_PATTERNS,
  APPOINTMENT_PATTERNS,
  AI_PATTERNS,
  CUSTOMER_PATTERNS,
  BRANCH_PATTERNS,
  QUEUE_PATTERNS,
  TICKET_PATTERNS,
} from '@repo/shared';
import {
  TelegramBot,
  TelegramBotDocument,
} from './schemas/telegram-bot.schema';
import {
  TelegramUser,
  TelegramUserDocument,
} from './schemas/telegram-user.schema';

/** Session state for booking flow */
interface BookingSession {
  step:
    | 'select_date'
    | 'select_slot'
    | 'confirm'
    | 'enter_phone'
    | 'enter_name';
  date?: string;
  timeSlot?: string;
  service?: string;
  phone?: string;
  firstName?: string;
}

/** Session state for queue-join flow */
interface QueueSession {
  step: 'select_branch' | 'select_service' | 'enter_phone' | 'enter_name';
  branchId?: string;
  branchName?: string;
  queueId?: string;
  queueName?: string;
  phone?: string;
  firstName?: string;
}

/** Pending-language set: users who just pressed /start and need to pick a language */
type PendingAction = 'onboarding' | 'none';

@Injectable()
export class BotManagerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BotManagerService.name);
  private readonly activeBots = new Map<string, Telegraf>();
  /** tenantId:telegramId → booking session */
  private readonly bookingSessions = new Map<string, BookingSession>();
  /** tenantId:telegramId → queue session */
  private readonly queueSessions = new Map<string, QueueSession>();
  /** tenantId:telegramId → pending action after language selection */
  private readonly pendingActions = new Map<string, PendingAction>();
  /** Per-user AI processing lock — one AI request at a time */
  private readonly processingAI = new Set<string>();

  // Localized bot messages
  private readonly messages = {
    start: {
      uz: "Assalomu alaykum! Men sizning AI yordamchingizman. Xizmat haqida savolingiz bo'lsa yozing yoki quyidagi buyruqlardan foydalaning.",
      ru: 'Здравствуйте! Я ваш AI-ассистент. Задайте вопрос о нашем сервисе или воспользуйтесь командами ниже.',
      en: "Hello! I'm your AI assistant. Ask me anything about our service or use the commands below.",
    },
    linked: {
      uz: "Telefon raqamingiz muvaffaqiyatli bog'landi!",
      ru: 'Ваш номер успешно привязан!',
      en: 'Your phone number has been linked!',
    },
    help: {
      uz: "Buyruqlar:\n/start - Boshlash\n/book - Uchrashuv belgilash\n/queue - Navbatga turish\n/language - Tilni o'zgartirish\n\nYoki shunchaki savol yozing - men AI yordamchiman!",
      ru: 'Команды:\n/start - Начать\n/book - Записаться на приём\n/queue - Встать в очередь\n/language - Сменить язык\n\nИли просто задайте вопрос — я AI-ассистент!',
      en: "Commands:\n/start - Start\n/book - Book an appointment\n/queue - Join a queue\n/language - Change language\n\nOr just type a question — I'm an AI assistant!",
    },
    bookStart: {
      uz: 'Uchrashuv belgilash uchun kunni tanlang:',
      ru: 'Выберите дату для записи:',
      en: 'Select a date for your appointment:',
    },
    selectSlot: {
      uz: 'Mavjud vaqtlarni tanlang:',
      ru: 'Выберите доступное время:',
      en: 'Select an available time slot:',
    },
    noSlots: {
      uz: "Afsuski, bu kunga bo'sh vaqt yo'q. Boshqa kunni tanlang.",
      ru: 'К сожалению, на этот день нет свободного времени. Выберите другой день.',
      en: 'Sorry, no available slots for this day. Please select another date.',
    },
    enterPhone: {
      uz: 'Iltimos, telefon raqamingizni yuboring (yoki kontaktingizni ulashing):',
      ru: 'Пожалуйста, отправьте ваш номер телефона (или поделитесь контактом):',
      en: 'Please send your phone number (or share your contact):',
    },
    enterName: {
      uz: 'Ismingizni kiriting:',
      ru: 'Введите ваше имя:',
      en: 'Enter your name:',
    },
    invalidPhone: {
      uz: "❌ Telefon raqam noto'g'ri. Iltimos, to'g'ri formatda yuboring: +998XXXXXXXXX yoki 9X XXXXXXX",
      ru: '❌ Неверный номер телефона. Пожалуйста, отправьте в формате: +998XXXXXXXXX или 9X XXXXXXX',
      en: '❌ Invalid phone number. Please send in format: +998XXXXXXXXX or 9X XXXXXXX',
    },
    bookingConfirmed: {
      uz: '✅ Uchrashuvingiz belgilandi!\n📅 Sana: {date}\n🕐 Vaqt: {time}',
      ru: '✅ Запись подтверждена!\n📅 Дата: {date}\n🕐 Время: {time}',
      en: '✅ Appointment confirmed!\n📅 Date: {date}\n🕐 Time: {time}',
    },
    bookingFailed: {
      uz: "Afsuski, uchrashuv belgilab bo'lmadi. Iltimos, qaytadan urinib ko'ring.",
      ru: 'К сожалению, не удалось записаться. Пожалуйста, попробуйте ещё раз.',
      en: 'Sorry, booking failed. Please try again.',
    },
    queueSelectBranch: {
      uz: 'Filialni tanlang:',
      ru: 'Выберите филиал:',
      en: 'Select a branch:',
    },
    queueSelectService: {
      uz: 'Xizmatni tanlang:',
      ru: 'Выберите услугу:',
      en: 'Select a service:',
    },
    queueNoBranches: {
      uz: "Afsuski, faol filiallar yo'q.",
      ru: 'К сожалению, нет активных филиалов.',
      en: 'Sorry, no active branches available.',
    },
    queueNoServices: {
      uz: "Bu filialda faol xizmatlar yo'q.",
      ru: 'В этом филиале нет активных услуг.',
      en: 'No active services in this branch.',
    },
    queueSuccess: {
      uz: '✅ Navbatga turdingiz!\n🎫 Talon: {ticket}\n📍 Filial: {branch}\n🛠 Xizmat: {service}',
      ru: '✅ Вы встали в очередь!\n🎫 Талон: {ticket}\n📍 Филиал: {branch}\n🛠 Услуга: {service}',
      en: '✅ You joined the queue!\n🎫 Ticket: {ticket}\n📍 Branch: {branch}\n🛠 Service: {service}',
    },
    queueFailed: {
      uz: "Afsuski, navbatga turib bo'lmadi. Qaytadan urinib ko'ring.",
      ru: 'Не удалось встать в очередь. Попробуйте ещё раз.',
      en: 'Failed to join the queue. Please try again.',
    },
    queueEnterPhone: {
      uz: 'Iltimos, telefon raqamingizni kiriting (masalan: +998901234567):',
      ru: 'Пожалуйста, введите номер телефона (например: +998901234567):',
      en: 'Please enter your phone number (e.g. +998901234567):',
    },
    queueEnterName: {
      uz: 'Ismingizni kiriting:',
      ru: 'Введите ваше имя:',
      en: 'Enter your name:',
    },
    queueWelcomeBack: {
      uz: '✅ {name}, xush kelibsiz! Navbat olinmoqda...',
      ru: '✅ {name}, добро пожаловать! Получаем талон...',
      en: '✅ {name}, welcome back! Getting your ticket...',
    },
    aiError: {
      uz: "Kechirasiz, hozirda javob bera olmayman. Keyinroq qayta urinib ko'ring.",
      ru: 'Извините, сейчас не могу ответить. Попробуйте позже.',
      en: 'Sorry, I cannot respond right now. Please try again later.',
    },
    confirmBooking: {
      uz: '📋 Uchrashuv tafsilotlari:\n\n📅 Sana: {date}\n🕐 Vaqt: {time}\n🛠 Xizmat: {service}\n\nTasdiqlaysizmi?',
      ru: '📋 Детали записи:\n\n📅 Дата: {date}\n🕐 Время: {time}\n🛠 Услуга: {service}\n\nПодтверждаете?',
      en: '📋 Appointment details:\n\n📅 Date: {date}\n🕐 Time: {time}\n🛠 Service: {service}\n\nConfirm?',
    },
    confirmYes: {
      uz: '✅ Tasdiqlash',
      ru: '✅ Подтвердить',
      en: '✅ Confirm',
    },
    confirmNo: {
      uz: '❌ Bekor qilish',
      ru: '❌ Отменить',
      en: '❌ Cancel',
    },
    bookingCancelled: {
      uz: '❌ Uchrashuv bekor qilindi.',
      ru: '❌ Запись отменена.',
      en: '❌ Booking cancelled.',
    },
  };

  constructor(
    @InjectModel(TelegramBot.name) private botModel: Model<TelegramBotDocument>,
    @InjectModel(TelegramUser.name)
    private userModel: Model<TelegramUserDocument>,
    @Inject(SERVICES.ACCOUNTS) private readonly accountsClient: ClientProxy,
    @Inject(SERVICES.QUEUE) private readonly queueClient: ClientProxy,
  ) {}

  async onModuleInit() {
    const bots = await this.botModel.find({ isActive: true }).exec();
    for (const bot of bots) {
      try {
        await this.startBot(bot.tenantId, bot.botToken);
        this.logger.log(`Started bot for tenant ${bot.tenantId}`);
      } catch (error) {
        this.logger.error(
          `Failed to start bot for tenant ${bot.tenantId}`,
          error,
        );
      }
    }
  }

  async onModuleDestroy() {
    for (const [tenantId, bot] of this.activeBots) {
      bot.stop('Module destroying');
      this.logger.log(`Stopped bot for tenant ${tenantId}`);
    }
  }

  async registerBot(tenantId: string, botToken: string) {
    const existing = await this.botModel.findOne({ tenantId }).exec();
    if (existing) {
      await this.stopBot(tenantId);
      existing.botToken = botToken;
      existing.isActive = true;

      const telegraf = new Telegraf(botToken);
      const botInfo = await telegraf.telegram.getMe();
      existing.botUsername = botInfo.username;
      await existing.save();

      await this.startBot(tenantId, botToken);
      return { success: true, username: botInfo.username };
    }

    const telegraf = new Telegraf(botToken);
    const botInfo = await telegraf.telegram.getMe();

    const botDoc = new this.botModel({
      tenantId,
      botToken,
      botUsername: botInfo.username,
      isActive: true,
    });
    await botDoc.save();

    await this.startBot(tenantId, botToken);
    return { success: true, username: botInfo.username };
  }

  async unregisterBot(tenantId: string) {
    await this.stopBot(tenantId);
    await this.botModel.findOneAndUpdate({ tenantId }, { isActive: false });
    return { success: true };
  }

  async sendMessage(tenantId: string, chatId: string, message: string) {
    const bot = this.activeBots.get(tenantId);
    if (!bot) {
      const botDoc = await this.botModel
        .findOne({ tenantId, isActive: true })
        .exec();
      if (!botDoc) {
        throw new RpcException('No active bot for this tenant');
      }
      const telegraf = new Telegraf(botDoc.botToken);
      await telegraf.telegram.sendMessage(chatId, message);
      return { success: true };
    }

    await bot.telegram.sendMessage(chatId, message);
    return { success: true };
  }

  async linkUser(data: {
    telegramId: string;
    phone: string;
    tenantId?: string;
  }) {
    const user = await this.userModel.findOneAndUpdate(
      { telegramId: parseInt(data.telegramId) },
      {
        $set: {
          phone: data.phone,
          tenantId: data.tenantId,
        },
      },
      { upsert: true, new: true },
    );
    return user;
  }

  async getBotStatus(tenantId: string) {
    const botDoc = await this.botModel.findOne({ tenantId }).exec();
    if (!botDoc) {
      return {
        exists: false,
        isActive: false,
        isRunning: false,
        username: null,
        createdAt: null,
        updatedAt: null,
      };
    }
    const isRunning = this.activeBots.has(tenantId);
    return {
      exists: true,
      isActive: botDoc.isActive,
      isRunning,
      username: botDoc.botUsername || null,
      createdAt: (botDoc as any).createdAt || null,
      updatedAt: (botDoc as any).updatedAt || null,
    };
  }

  async startBot_(tenantId: string) {
    const botDoc = await this.botModel.findOne({ tenantId }).exec();
    if (!botDoc) throw new RpcException('No bot configured for this tenant');
    if (this.activeBots.has(tenantId))
      return { success: true, message: 'Bot is already running' };
    await this.startBot(tenantId, botDoc.botToken);
    await this.botModel.findOneAndUpdate({ tenantId }, { isActive: true });
    return { success: true, message: 'Bot started' };
  }

  async stopBot_(tenantId: string) {
    const botDoc = await this.botModel.findOne({ tenantId }).exec();
    if (!botDoc) throw new RpcException('No bot configured for this tenant');
    await this.stopBot(tenantId);
    await this.botModel.findOneAndUpdate({ tenantId }, { isActive: false });
    return { success: true, message: 'Bot stopped' };
  }

  async restartBot(tenantId: string) {
    const botDoc = await this.botModel.findOne({ tenantId }).exec();
    if (!botDoc) throw new RpcException('No bot configured for this tenant');
    await this.stopBot(tenantId);
    await this.startBot(tenantId, botDoc.botToken);
    await this.botModel.findOneAndUpdate({ tenantId }, { isActive: true });
    return { success: true, message: 'Bot restarted' };
  }

  async deleteBot(tenantId: string) {
    await this.stopBot(tenantId);
    await this.botModel.findOneAndDelete({ tenantId });
    await this.userModel.deleteMany({ tenantId });
    return { success: true, message: 'Bot deleted' };
  }

  async getBotStats(tenantId: string) {
    const botDoc = await this.botModel.findOne({ tenantId }).exec();
    if (!botDoc)
      return {
        totalUsers: 0,
        linkedUsers: 0,
        isRunning: false,
        username: null,
      };
    const totalUsers = await this.userModel.countDocuments({ tenantId }).exec();
    const linkedUsers = await this.userModel
      .countDocuments({ tenantId, phone: { $exists: true, $ne: '' } })
      .exec();
    const isRunning = this.activeBots.has(tenantId);
    return {
      totalUsers,
      linkedUsers,
      isRunning,
      username: botDoc.botUsername || null,
      isActive: botDoc.isActive,
      createdAt: (botDoc as any).createdAt || null,
    };
  }

  // ────────────────── PRIVATE HELPERS ──────────────────

  /** Fetch tenant info from accounts service */
  private async getTenantInfo(tenantId: string): Promise<any> {
    try {
      return await firstValueFrom(
        this.accountsClient.send(TENANT_PATTERNS.FIND_ONE, { id: tenantId }),
      );
    } catch (err) {
      this.logger.error(`Failed to fetch tenant ${tenantId}`, err);
      return null;
    }
  }

  /** Get available appointment slots from accounts service */
  private async getAvailableSlots(
    tenantId: string,
    date: string,
  ): Promise<{ time: string; available: boolean }[]> {
    try {
      return await firstValueFrom(
        this.accountsClient.send(APPOINTMENT_PATTERNS.GET_AVAILABLE_SLOTS, {
          tenantId,
          date,
        }),
      );
    } catch (err) {
      this.logger.error(`Failed to fetch slots for ${tenantId}`, err);
      return [];
    }
  }

  /** Create an appointment via accounts service */
  private async createAppointment(data: any): Promise<any> {
    try {
      return await firstValueFrom(
        this.accountsClient.send(APPOINTMENT_PATTERNS.CREATE, data),
      );
    } catch (err) {
      this.logger.error(`Failed to create appointment`, err);
      return null;
    }
  }

  /** AI chat via accounts service — restricted to service info only */
  private async aiChat(
    tenantId: string,
    message: string,
    lang: 'uz' | 'ru' | 'en' = 'uz',
  ): Promise<string> {
    const langInstruction = {
      uz: "Foydalanuvchi bilan o'zbek tilida gaplashing.",
      ru: 'Отвечай пользователю на русском языке.',
      en: 'Respond to the user in English.',
    };
    try {
      const result = await firstValueFrom(
        this.accountsClient.send(AI_PATTERNS.SUGGEST, {
          tenantId,
          prompt: message,
          context: {
            source: 'telegram_bot',
            systemInstruction: [
              'You are a helpful customer service assistant for a business.',
              'You can ONLY provide: general information about the services offered, available (free) appointment time slots for days the user asks about, queue status, and general business information (address, working hours).',
              'When the user asks about availability for a specific day, list ONLY the FREE/AVAILABLE time slots. NEVER reveal who booked other slots or any customer names, phone numbers, or personal data.',
              'NEVER share any sensitive, internal, or private data such as: customer names, customer phone numbers, booked appointment details, employee details, revenue, internal settings, tenant configuration, API keys, passwords, or any workspace/admin data.',
              'If the user asks for anything outside service information or available slots, politely redirect them to available services or suggest they contact support.',
              'Be concise, friendly, and helpful.',
              langInstruction[lang],
            ].join(' '),
          },
        }),
      );
      return result?.suggestion || result?.message || '';
    } catch (err) {
      this.logger.error(`AI chat failed for tenant ${tenantId}`, err);
      return '';
    }
  }

  /** Register or find customer via accounts service */
  private async findOrCreateCustomer(data: {
    tenantId: string;
    phone: string;
    firstName?: string;
    telegramId?: string;
    telegramChatId?: string;
  }): Promise<any> {
    try {
      return await firstValueFrom(
        this.accountsClient.send(CUSTOMER_PATTERNS.FIND_OR_CREATE, data),
      );
    } catch (err) {
      this.logger.error(`Customer findOrCreate failed`, err);
      return null;
    }
  }

  /** Find customer by phone (no creation) */
  private async findCustomerByPhone(
    tenantId: string,
    phone: string,
  ): Promise<any> {
    try {
      return await firstValueFrom(
        this.accountsClient.send(CUSTOMER_PATTERNS.FIND_BY_PHONE, {
          tenantId,
          phone,
        }),
      );
    } catch {
      return null;
    }
  }

  /** Fetch branches for a tenant */
  private async getBranches(tenantId: string): Promise<any[]> {
    try {
      const branches = await firstValueFrom(
        this.accountsClient.send(BRANCH_PATTERNS.FIND_ALL, { tenantId }),
      );
      return (Array.isArray(branches) ? branches : []).filter(
        (b: any) => b.isActive,
      );
    } catch (err) {
      this.logger.error(`Failed to fetch branches for ${tenantId}`, err);
      return [];
    }
  }

  /** Fetch active queues/services for a branch */
  private async getQueues(tenantId: string, branchId: string): Promise<any[]> {
    try {
      const queues = await firstValueFrom(
        this.queueClient.send(QUEUE_PATTERNS.FIND_ALL, { tenantId, branchId }),
      );
      return (Array.isArray(queues) ? queues : []).filter(
        (q: any) => q.isActive,
      );
    } catch (err) {
      this.logger.error(`Failed to fetch queues`, err);
      return [];
    }
  }

  /** Create a ticket via queue service */
  private async createTicket(data: {
    tenantId: string;
    branchId: string;
    queueId: string;
    customerPhone?: string;
    customerTelegramId?: string;
  }): Promise<any> {
    try {
      return await firstValueFrom(
        this.queueClient.send(TICKET_PATTERNS.CREATE, data),
      );
    } catch (err) {
      this.logger.error(`Failed to create ticket`, err);
      return null;
    }
  }

  /** Get session key */
  private sessionKey(tenantId: string, telegramId: number): string {
    return `${tenantId}:${telegramId}`;
  }

  /** Generate next 7 days as inline keyboard buttons */
  private generateDateKeyboard() {
    const rows: { text: string; callback_data: string }[][] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const label =
        i === 0
          ? `📅 Today (${dateStr})`
          : i === 1
            ? `📅 Tomorrow (${dateStr})`
            : `📅 ${dateStr}`;
      rows.push([{ text: label, callback_data: `book_date_${dateStr}` }]);
    }
    return rows;
  }

  /** Build slot keyboard from available slots */
  private generateSlotKeyboard(
    slots: { time: string; available: boolean }[],
  ): { text: string; callback_data: string }[][] {
    const available = slots.filter((s) => s.available);
    const rows: { text: string; callback_data: string }[][] = [];
    // 3 per row
    for (let i = 0; i < available.length; i += 3) {
      const row = available.slice(i, i + 3).map((s) => ({
        text: `🕐 ${s.time}`,
        callback_data: `book_slot_${s.time}`,
      }));
      rows.push(row);
    }
    return rows;
  }

  // ────────────────── START BOT ──────────────────

  private async startBot(tenantId: string, token: string) {
    const bot = new Telegraf(token);

    // ──── /start command ────
    bot.start(async (ctx) => {
      const existingUser = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();

      // Upsert basic user info
      await this.userModel.findOneAndUpdate(
        { telegramId: ctx.from.id },
        {
          $set: {
            chatId: ctx.chat.id,
            firstName: ctx.from.first_name,
            lastName: ctx.from.last_name,
            tenantId,
          },
          $setOnInsert: {
            telegramId: ctx.from.id,
            language: 'uz',
          },
        },
        { upsert: true },
      );

      // If user already has a chosen language, go straight to main menu
      if (existingUser?.language) {
        const lang = existingUser.language as 'uz' | 'ru' | 'en';
        await this.sendMainMenu(ctx, lang);
      } else {
        // New user → ask language first (always in Uzbek)
        const key = this.sessionKey(tenantId, ctx.from.id);
        this.pendingActions.set(key, 'onboarding');
        await ctx.reply(
          'Assalomu alaykum! 👋\nTilni tanlang / Выберите язык / Choose language:',
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🇺🇿 O'zbek", callback_data: 'lang_uz' },
                  { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
                  { text: '🇬🇧 English', callback_data: 'lang_en' },
                ],
              ],
            },
          },
        );
      }
    });

    // ──── /book command ────
    bot.command('book', async (ctx) => {
      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      this.bookingSessions.set(this.sessionKey(tenantId, ctx.from.id), {
        step: 'select_date',
      });

      await ctx.reply(this.messages.bookStart[lang], {
        reply_markup: { inline_keyboard: this.generateDateKeyboard() },
      });
    });

    // ──── Booking start callback ────
    bot.action('start_booking', async (ctx) => {
      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      this.bookingSessions.set(this.sessionKey(tenantId, ctx.from!.id), {
        step: 'select_date',
      });

      await ctx.editMessageText(this.messages.bookStart[lang], {
        reply_markup: { inline_keyboard: this.generateDateKeyboard() },
      });
    });

    // ──── Booking confirm callback ────
    bot.action('book_confirm', async (ctx) => {
      const key = this.sessionKey(tenantId, ctx.from!.id);
      const session = this.bookingSessions.get(key);
      if (!session || session.step !== 'confirm') return;

      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      await ctx.answerCbQuery();
      await this.finalizeBooking(ctx, tenantId, session, lang);
      this.bookingSessions.delete(key);
    });

    // ──── Booking cancel callback ────
    bot.action('book_cancel', async (ctx) => {
      const key = this.sessionKey(tenantId, ctx.from!.id);
      this.bookingSessions.delete(key);
      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      await ctx.answerCbQuery();
      await ctx.editMessageText(this.messages.bookingCancelled[lang]);
    });

    // ──── Change language callback ────
    bot.action('change_language', async (ctx) => {
      await ctx.answerCbQuery();
      await ctx.editMessageText(
        'Tilni tanlang / Выберите язык / Choose language:',
        {
          reply_markup: {
            inline_keyboard: [
              [
                { text: "🇺🇿 O'zbek", callback_data: 'lang_uz' },
                { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
                { text: '🇬🇧 English', callback_data: 'lang_en' },
              ],
            ],
          },
        },
      );
    });

    // ──── /queue command ────
    bot.command('queue', async (ctx) => {
      await this.startQueueFlow(ctx, tenantId);
    });

    // ──── Queue start callback ────
    bot.action('start_queue', async (ctx) => {
      await ctx.answerCbQuery();
      await this.startQueueFlow(ctx, tenantId);
    });

    // ──── Queue branch selection ────
    bot.action(/^queue_branch_(.+)$/, async (ctx) => {
      const branchId = ctx.match[1];
      const key = this.sessionKey(tenantId, ctx.from!.id);
      const session = this.queueSessions.get(key);
      if (!session) return;

      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      // Fetch services for this branch
      const queues = await this.getQueues(tenantId, branchId);
      if (queues.length === 0) {
        await ctx.editMessageText(this.messages.queueNoServices[lang]);
        this.queueSessions.delete(key);
        return;
      }

      // Try to get branch name from the button text
      const branches = await this.getBranches(tenantId);
      const selectedBranch = branches.find((b: any) => b._id === branchId);

      session.branchId = branchId;
      session.branchName = selectedBranch?.name || '';
      session.step = 'select_service';
      this.queueSessions.set(key, session);

      const keyboard = queues.map((q: any) => [
        {
          text: `🏷 ${q.name}`,
          callback_data: `queue_service_${q._id}_${q.name}`,
        },
      ]);

      await ctx.editMessageText(this.messages.queueSelectService[lang], {
        reply_markup: { inline_keyboard: keyboard },
      });
    });

    // ──── Queue service selection ────
    bot.action(/^queue_service_([^_]+)_(.+)$/, async (ctx) => {
      const queueId = ctx.match[1];
      const queueName = ctx.match[2];
      const key = this.sessionKey(tenantId, ctx.from!.id);
      const session = this.queueSessions.get(key);
      if (!session || !session.branchId) return;

      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      session.queueId = queueId;
      session.queueName = queueName;

      // Check if user already has phone
      if (user?.phone) {
        session.phone = user.phone;
        // Check if customer exists
        const customer = await this.findCustomerByPhone(tenantId, user.phone);
        if (customer) {
          session.firstName = customer.firstName;
          await ctx.editMessageText(
            this.messages.queueWelcomeBack[lang].replace(
              '{name}',
              customer.firstName,
            ),
          );
          await this.finalizeQueueJoin(ctx, tenantId, session, lang);
          this.queueSessions.delete(key);
        } else {
          // Has phone but not registered — ask name
          session.step = 'enter_name';
          this.queueSessions.set(key, session);
          await ctx.editMessageText(this.messages.queueEnterName[lang]);
        }
      } else {
        // No phone — ask for it
        session.step = 'enter_phone';
        this.queueSessions.set(key, session);
        await ctx.editMessageText(this.messages.queueEnterPhone[lang]);
      }
    });

    // ──── Share phone prompt ────
    bot.action('share_phone_prompt', async (ctx) => {
      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';
      const btnLabels = {
        uz: '📱 Telefon raqamni yuborish',
        ru: '📱 Отправить номер телефона',
        en: '📱 Share phone number',
      };
      await ctx.answerCbQuery();
      await ctx.reply(this.messages.enterPhone[lang], {
        reply_markup: {
          keyboard: [[{ text: btnLabels[lang], request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      });
    });

    // ──── Date selection callback ────
    bot.action(/^book_date_(\d{4}-\d{2}-\d{2})$/, async (ctx) => {
      const date = ctx.match[1];
      const key = this.sessionKey(tenantId, ctx.from!.id);
      const session = this.bookingSessions.get(key) || {
        step: 'select_date' as const,
      };
      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      // Fetch available slots
      const slots = await this.getAvailableSlots(tenantId, date);
      const availableSlots = slots.filter((s) => s.available);

      if (availableSlots.length === 0) {
        await ctx.editMessageText(this.messages.noSlots[lang], {
          reply_markup: { inline_keyboard: this.generateDateKeyboard() },
        });
        return;
      }

      session.step = 'select_slot';
      session.date = date;
      this.bookingSessions.set(key, session);

      await ctx.editMessageText(
        `${this.messages.selectSlot[lang]}\n📅 ${date}`,
        {
          reply_markup: {
            inline_keyboard: this.generateSlotKeyboard(slots),
          },
        },
      );
    });

    // ──── Slot selection callback ────
    bot.action(/^book_slot_(\d{2}:\d{2})$/, async (ctx) => {
      const time = ctx.match[1];
      const key = this.sessionKey(tenantId, ctx.from!.id);
      const session = this.bookingSessions.get(key);
      if (!session || !session.date) return;

      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      session.timeSlot = time;

      // Resolve service name
      const tenant = await this.getTenantInfo(tenantId);
      session.service =
        tenant?.soloProfile?.services?.[0] ||
        tenant?.soloProfile?.businessType ||
        'General';

      // Check if user has a phone already
      if (user?.phone) {
        session.phone = user.phone;
        session.firstName = user.firstName || ctx.from.first_name;
        session.step = 'confirm';
        this.bookingSessions.set(key, session);
        await this.showBookingConfirmation(ctx, session, lang, true);
      } else {
        // Need phone number
        session.step = 'enter_phone';
        this.bookingSessions.set(key, session);
        const btnLabels = {
          uz: '📱 Telefon raqamni yuborish',
          ru: '📱 Отправить номер телефона',
          en: '📱 Share phone number',
        };
        await ctx.editMessageText(this.messages.enterPhone[lang]);
        await ctx.reply(this.messages.enterPhone[lang], {
          reply_markup: {
            keyboard: [
              [
                {
                  text: btnLabels[lang],
                  request_contact: true,
                },
              ],
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
          },
        });
      }
    });

    // ──── Handle contact (phone number) ────
    bot.on('contact', async (ctx) => {
      const rawPhone = ctx.message.contact.phone_number;
      const phone = this.normalizePhone(rawPhone) || rawPhone;
      await this.userModel.findOneAndUpdate(
        { telegramId: ctx.from.id },
        { $set: { phone, chatId: ctx.chat.id } },
        { upsert: true },
      );

      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      const key = this.sessionKey(tenantId, ctx.from.id);

      // Check if we're in a booking flow
      const bookSession = this.bookingSessions.get(key);
      if (
        bookSession &&
        bookSession.step === 'enter_phone' &&
        bookSession.date &&
        bookSession.timeSlot
      ) {
        bookSession.phone = phone;
        bookSession.firstName = ctx.from.first_name;
        if (!bookSession.service) {
          const tenant = await this.getTenantInfo(tenantId);
          bookSession.service =
            tenant?.soloProfile?.services?.[0] ||
            tenant?.soloProfile?.businessType ||
            'General';
        }
        bookSession.step = 'confirm';
        this.bookingSessions.set(key, bookSession);
        await this.showBookingConfirmation(ctx, bookSession, lang, false);
        return;
      }

      // Check if we're in a queue flow
      const queueSession = this.queueSessions.get(key);
      if (queueSession && queueSession.step === 'enter_phone') {
        queueSession.phone = phone;
        // Save phone to user profile
        await this.userModel.findOneAndUpdate(
          { telegramId: ctx.from.id },
          { $set: { phone } },
          { upsert: true },
        );
        // Check if customer exists
        const customer = await this.findCustomerByPhone(tenantId, phone);
        if (customer) {
          queueSession.firstName = customer.firstName;
          await ctx.reply(
            this.messages.queueWelcomeBack[lang].replace(
              '{name}',
              customer.firstName,
            ),
            { reply_markup: { remove_keyboard: true } },
          );
          await this.finalizeQueueJoin(ctx, tenantId, queueSession, lang);
          this.queueSessions.delete(key);
        } else {
          queueSession.step = 'enter_name';
          this.queueSessions.set(key, queueSession);
          await ctx.reply(this.messages.queueEnterName[lang], {
            reply_markup: { remove_keyboard: true },
          });
        }
        return;
      }

      // Not in any flow — just register customer
      await this.findOrCreateCustomer({
        tenantId,
        phone,
        firstName: ctx.from.first_name,
        telegramId: String(ctx.from.id),
        telegramChatId: String(ctx.chat.id),
      });
      await ctx.reply(this.messages.linked[lang], {
        reply_markup: { remove_keyboard: true },
      });
    });

    // ──── /language command ────
    bot.command('language', async (ctx) => {
      await ctx.reply('Tilni tanlang / Выберите язык / Choose language:', {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🇺🇿 O'zbek", callback_data: 'lang_uz' },
              { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
              { text: '🇬🇧 English', callback_data: 'lang_en' },
            ],
          ],
        },
      });
    });

    // Language selection callback
    bot.action(/^lang_(uz|ru|en)$/, async (ctx) => {
      const lang = ctx.match[1] as 'uz' | 'ru' | 'en';
      await this.userModel.findOneAndUpdate(
        { telegramId: ctx.from.id },
        { $set: { language: lang } },
      );

      const confirmations = {
        uz: "Til o'zgartirildi! ✅",
        ru: 'Язык изменён! ✅',
        en: 'Language changed! ✅',
      };
      await ctx.answerCbQuery(confirmations[lang]);

      // Check if this was part of onboarding (first /start)
      const key = this.sessionKey(tenantId, ctx.from!.id);
      const pending = this.pendingActions.get(key);
      this.pendingActions.delete(key);

      if (pending === 'onboarding') {
        // First-time user → show welcome + main menu
        await ctx.editMessageText(this.messages.start[lang]);
        await this.sendMainMenu(ctx, lang);
      } else {
        await ctx.editMessageText(confirmations[lang]);
      }
    });

    // ──── /help command ────
    bot.help(async (ctx) => {
      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';
      await ctx.reply(this.messages.help[lang]);
    });

    // ──── AI chat: handle all text messages ────
    bot.on('text', async (ctx) => {
      const text = ctx.message.text;

      // Ignore commands
      if (text.startsWith('/')) return;

      const key = this.sessionKey(tenantId, ctx.from.id);

      // ── Check if user is in queue flow ──
      const qSession = this.queueSessions.get(key);
      if (qSession) {
        const user = await this.userModel
          .findOne({ telegramId: ctx.from.id })
          .exec();
        const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

        if (qSession.step === 'enter_phone') {
          const phone = this.normalizePhone(text);
          if (phone) {
            qSession.phone = phone;
            // Save phone to user profile
            await this.userModel.findOneAndUpdate(
              { telegramId: ctx.from.id },
              { $set: { phone } },
              { upsert: true },
            );
            // Check if customer exists
            const customer = await this.findCustomerByPhone(tenantId, phone);
            if (customer) {
              qSession.firstName = customer.firstName;
              await ctx.reply(
                this.messages.queueWelcomeBack[lang].replace(
                  '{name}',
                  customer.firstName,
                ),
              );
              await this.finalizeQueueJoin(ctx, tenantId, qSession, lang);
              this.queueSessions.delete(key);
            } else {
              qSession.step = 'enter_name';
              this.queueSessions.set(key, qSession);
              await ctx.reply(this.messages.queueEnterName[lang]);
            }
          } else {
            await ctx.reply(this.messages.invalidPhone[lang]);
          }
          return;
        }

        if (qSession.step === 'enter_name') {
          qSession.firstName = text.trim();
          await this.finalizeQueueJoin(ctx, tenantId, qSession, lang);
          this.queueSessions.delete(key);
          return;
        }
      }

      // ── Check if user is in booking flow ──
      const session = this.bookingSessions.get(key);

      if (session) {
        // Handle phone entry in booking flow
        if (session.step === 'enter_phone') {
          const phone = this.normalizePhone(text);
          if (phone) {
            session.phone = phone;
            const user = await this.userModel
              .findOne({ telegramId: ctx.from.id })
              .exec();
            const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

            // Save phone to user profile
            await this.userModel.findOneAndUpdate(
              { telegramId: ctx.from.id },
              { $set: { phone } },
              { upsert: true },
            );

            session.firstName = ctx.from.first_name || user?.firstName;
            if (session.firstName) {
              if (!session.service) {
                const tenant = await this.getTenantInfo(tenantId);
                session.service =
                  tenant?.soloProfile?.services?.[0] ||
                  tenant?.soloProfile?.businessType ||
                  'General';
              }
              session.step = 'confirm';
              this.bookingSessions.set(key, session);
              await this.showBookingConfirmation(ctx, session, lang, false);
            } else {
              session.step = 'enter_name';
              this.bookingSessions.set(key, session);
              await ctx.reply(this.messages.enterName[lang]);
            }
            return;
          } else {
            const user = await this.userModel
              .findOne({ telegramId: ctx.from.id })
              .exec();
            const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';
            await ctx.reply(this.messages.invalidPhone[lang]);
            return;
          }
        }

        // Handle name entry in booking flow
        if (session.step === 'enter_name') {
          session.firstName = text.trim();
          const user = await this.userModel
            .findOne({ telegramId: ctx.from.id })
            .exec();
          const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';
          if (!session.service) {
            const tenant = await this.getTenantInfo(tenantId);
            session.service =
              tenant?.soloProfile?.services?.[0] ||
              tenant?.soloProfile?.businessType ||
              'General';
          }
          session.step = 'confirm';
          this.bookingSessions.set(key, session);
          await this.showBookingConfirmation(ctx, session, lang, false);
          return;
        }
      }

      // ──── AI Chat Response ────
      const user = await this.userModel
        .findOne({ telegramId: ctx.from.id })
        .exec();
      const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';

      // Per-user sync lock — process one AI request at a time
      if (this.processingAI.has(key)) return;
      this.processingAI.add(key);

      try {
        // Show typing indicator
        await ctx.sendChatAction('typing');

        const aiResponse = await this.aiChat(tenantId, text, lang);
        if (aiResponse) {
          // Detect booking intent → offer date picker alongside AI response
          const bookingKeywords = [
            'book',
            'appointment',
            'записаться',
            'запись на',
            'забронировать',
            'бронь',
            'uchrashuv',
            'belgilash',
            'bron',
            'yozilish',
            'yozilmoq',
            'band qilish',
          ];
          const lowerText = text.toLowerCase();
          const hasBookingIntent = bookingKeywords.some((kw) =>
            lowerText.includes(kw),
          );

          await ctx.reply(aiResponse);

          if (hasBookingIntent) {
            this.bookingSessions.set(key, { step: 'select_date' });
            await ctx.reply(this.messages.bookStart[lang], {
              reply_markup: {
                inline_keyboard: this.generateDateKeyboard(),
              },
            });
          }
        } else {
          await ctx.reply(this.messages.aiError[lang]);
        }
      } catch (err) {
        this.logger.error(`AI chat error for tenant ${tenantId}`, err);
        await ctx.reply(this.messages.aiError[lang]);
      } finally {
        this.processingAI.delete(key);
      }
    });

    // Launch bot (polling mode)
    bot.launch({ dropPendingUpdates: true });
    this.activeBots.set(tenantId, bot);
  }

  /** Start the queue-join flow: fetch branches and show selection */
  private async startQueueFlow(ctx: any, tenantId: string) {
    const user = await this.userModel
      .findOne({ telegramId: ctx.from?.id })
      .exec();
    const lang = (user?.language || 'uz') as 'uz' | 'ru' | 'en';
    const key = this.sessionKey(tenantId, ctx.from!.id);

    const branches = await this.getBranches(tenantId);
    if (branches.length === 0) {
      await ctx.reply(this.messages.queueNoBranches[lang]);
      return;
    }

    this.queueSessions.set(key, { step: 'select_branch' });

    if (branches.length === 1) {
      // Auto-select the only branch
      const branch = branches[0];
      const session = this.queueSessions.get(key)!;
      session.branchId = branch._id;
      session.branchName = branch.name;
      session.step = 'select_service';

      const queues = await this.getQueues(tenantId, branch._id);
      if (queues.length === 0) {
        await ctx.reply(this.messages.queueNoServices[lang]);
        this.queueSessions.delete(key);
        return;
      }

      this.queueSessions.set(key, session);
      const keyboard = queues.map((q: any) => [
        {
          text: `🏷 ${q.name}`,
          callback_data: `queue_service_${q._id}_${q.name}`,
        },
      ]);
      await ctx.reply(
        `📍 ${branch.name}\n\n${this.messages.queueSelectService[lang]}`,
        { reply_markup: { inline_keyboard: keyboard } },
      );
    } else {
      // Show branch selection
      const keyboard = branches.map((b: any) => [
        { text: `📍 ${b.name}`, callback_data: `queue_branch_${b._id}` },
      ]);
      await ctx.reply(this.messages.queueSelectBranch[lang], {
        reply_markup: { inline_keyboard: keyboard },
      });
    }
  }

  /** Finalize queue join: register customer + create ticket */
  private async finalizeQueueJoin(
    ctx: any,
    tenantId: string,
    session: QueueSession,
    lang: 'uz' | 'ru' | 'en',
  ) {
    try {
      // Register / find customer
      if (session.phone) {
        await this.findOrCreateCustomer({
          tenantId,
          phone: session.phone,
          firstName: session.firstName || ctx.from?.first_name || 'Customer',
          telegramId: String(ctx.from?.id),
          telegramChatId: String(ctx.chat?.id || ctx.from?.id),
        });
      }

      // Create ticket
      const ticket = await this.createTicket({
        tenantId,
        branchId: session.branchId!,
        queueId: session.queueId!,
        customerPhone: session.phone,
        customerTelegramId: String(ctx.from?.id),
      });

      if (ticket) {
        const msg = this.messages.queueSuccess[lang]
          .replace('{ticket}', ticket.ticketNumber || ticket.publicId)
          .replace('{branch}', session.branchName || '')
          .replace('{service}', session.queueName || '');
        await ctx.reply(msg, {
          reply_markup: { remove_keyboard: true },
        });
      } else {
        await ctx.reply(this.messages.queueFailed[lang]);
      }
    } catch (err) {
      this.logger.error('Queue join finalization error', err);
      await ctx.reply(this.messages.queueFailed[lang]);
    }
  }

  /** Finalize a booking: register customer + create appointment */
  private async finalizeBooking(
    ctx: any,
    tenantId: string,
    session: BookingSession,
    lang: 'uz' | 'ru' | 'en',
  ) {
    try {
      // Register / find customer
      if (session.phone) {
        await this.findOrCreateCustomer({
          tenantId,
          phone: session.phone,
          firstName: session.firstName || ctx.from?.first_name || 'Customer',
          telegramId: String(ctx.from?.id),
          telegramChatId: String(ctx.chat?.id || ctx.from?.id),
        });
      }

      // Get tenant info for duration
      const tenant = await this.getTenantInfo(tenantId);
      const serviceName =
        session.service ||
        tenant?.soloProfile?.services?.[0] ||
        tenant?.soloProfile?.businessType ||
        'General';

      // Create appointment
      const appointment = await this.createAppointment({
        tenantId,
        customerName: session.firstName || ctx.from?.first_name || 'Customer',
        customerPhone: session.phone,
        customerTelegramId: String(ctx.from?.id),
        service: serviceName,
        date: session.date,
        timeSlot: session.timeSlot,
        duration:
          tenant?.soloProfile?.slotDuration || tenant?.avgServiceTime || 30,
      });

      if (appointment) {
        const msg = this.messages.bookingConfirmed[lang]
          .replace('{date}', session.date!)
          .replace('{time}', session.timeSlot!);
        await ctx.reply(msg, {
          reply_markup: { remove_keyboard: true },
        });
      } else {
        await ctx.reply(this.messages.bookingFailed[lang]);
      }
    } catch (err) {
      this.logger.error('Booking finalization error', err);
      await ctx.reply(this.messages.bookingFailed[lang]);
    }
  }

  /** Show booking confirmation with inline Yes/No */
  private async showBookingConfirmation(
    ctx: any,
    session: BookingSession,
    lang: 'uz' | 'ru' | 'en',
    edit = false,
  ) {
    const msg = this.messages.confirmBooking[lang]
      .replace('{date}', session.date!)
      .replace('{time}', session.timeSlot!)
      .replace('{service}', session.service || 'General');

    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: this.messages.confirmYes[lang],
              callback_data: 'book_confirm',
            },
            {
              text: this.messages.confirmNo[lang],
              callback_data: 'book_cancel',
            },
          ],
        ],
      },
    };

    if (edit) {
      await ctx.editMessageText(msg, opts);
    } else {
      await ctx.reply(msg, opts);
    }
  }

  private async stopBot(tenantId: string) {
    const bot = this.activeBots.get(tenantId);
    if (bot) {
      bot.stop('Bot unregistered');
      this.activeBots.delete(tenantId);
    }
  }

  /** Send localized main menu with action buttons */
  private async sendMainMenu(ctx: any, lang: 'uz' | 'ru' | 'en') {
    const labels = {
      uz: {
        book: '📅 Uchrashuv belgilash',
        queue: '🎫 Navbatga turish',
        lang: "🌐 Tilni o'zgartirish",
        phone: '📱 Telefon yuborish',
      },
      ru: {
        book: '📅 Записаться',
        queue: '🎫 Встать в очередь',
        lang: '🌐 Сменить язык',
        phone: '📱 Отправить номер',
      },
      en: {
        book: '📅 Book Appointment',
        queue: '🎫 Join Queue',
        lang: '🌐 Change Language',
        phone: '📱 Share Phone',
      },
    };
    const l = labels[lang];
    await ctx.reply(this.messages.start[lang], {
      reply_markup: {
        inline_keyboard: [
          [{ text: l.book, callback_data: 'start_booking' }],
          [{ text: l.queue, callback_data: 'start_queue' }],
          [
            { text: l.lang, callback_data: 'change_language' },
            { text: l.phone, callback_data: 'share_phone_prompt' },
          ],
        ],
      },
    });
  }

  /**
   * Normalize an Uzbek phone number to +998XXXXXXXXX format.
   * Accepts inputs like: 970000000, +998970000000, 998970000000, 8970000000
   * Returns the formatted string or null if invalid.
   */
  private normalizePhone(input: string): string | null {
    let cleaned = input.replace(/[\s\-\(\)\+]/g, '');

    // Strip leading 8 (old local prefix) — 8970000000 → 970000000
    if (cleaned.startsWith('8') && cleaned.length === 10) {
      cleaned = cleaned.substring(1);
    }

    // If it starts with 998 and is 12 digits, strip 998 prefix to get 9 digits
    if (cleaned.startsWith('998') && cleaned.length === 12) {
      cleaned = cleaned.substring(3);
    }

    // Now we expect exactly 9 digits (local number)
    if (/^\d{9}$/.test(cleaned)) {
      return '+998' + cleaned;
    }

    return null;
  }
}
