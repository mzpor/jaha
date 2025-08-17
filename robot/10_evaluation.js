/**
 * 📊 ماژول سیستم ارزیابی
 * نسخه: 2.0.0
 * تاریخ: 1404/05/17
 */

const path = require('path');
const fs = require('fs');
const eventManager = require('./03_events');

class EvaluationManager {
    constructor() {
        this.dataFile = path.join(__dirname, 'data', 'evaluation_system.json');
        this.evaluations = {};
        this.questions = {};
        this.results = {};
        this.practiceData = {};
        this.satisfactionData = {};
        this.loadData();
        this.initializeEventListeners();
    }

    // بارگذاری داده‌ها
    loadData() {
        try {
            if (fs.existsSync(this.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
                this.evaluations = data.evaluations || {};
                this.questions = data.questions || {};
                this.results = data.results || {};
                this.practiceData = data.practiceData || {};
                this.satisfactionData = data.satisfactionData || {};
                console.log(`✅ [EVAL] داده‌های ارزیابی بارگذاری شد`);
            }
        } catch (error) {
            console.error('❌ [EVAL] خطا در بارگذاری داده‌ها:', error.message);
            this.initializeDefaultData();
        }
    }

    // مقداردهی اولیه داده‌های پیش‌فرض
    initializeDefaultData() {
        this.questions = {
            general: [
                {
                    id: 'q1',
                    text: 'میزان رضایت شما از کیفیت آموزش چقدر است؟',
                    type: 'rating',
                    options: ['خیلی کم', 'کم', 'متوسط', 'زیاد', 'خیلی زیاد']
                },
                {
                    id: 'q2',
                    text: 'آیا محتوای آموزشی برای شما مفید بوده است؟',
                    type: 'yes_no',
                    options: ['بله', 'خیر']
                }
            ],
            practice: [
                {
                    id: 'p1',
                    text: 'میزان تمرین روزانه شما چقدر است؟',
                    type: 'rating',
                    options: ['کمتر از 30 دقیقه', '30-60 دقیقه', '1-2 ساعت', 'بیش از 2 ساعت']
                }
            ]
        };

        this.evaluations = {};
        this.results = {};
        this.practiceData = {};
        this.satisfactionData = {};
    }

    // ذخیره داده‌ها
    saveData() {
        try {
            const dir = path.dirname(this.dataFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const data = {
                evaluations: this.evaluations,
                questions: this.questions,
                results: this.results,
                practiceData: this.practiceData,
                satisfactionData: this.satisfactionData,
                lastUpdated: new Date().toISOString()
            };

            fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
            console.log('✅ [EVAL] داده‌های ارزیابی ذخیره شدند');
        } catch (error) {
            console.error('❌ [EVAL] خطا در ذخیره داده‌ها:', error.message);
        }
    }

    // مقداردهی اولیه event listeners
    initializeEventListeners() {
        eventManager.onEvent('evaluation:started', (data) => {
            console.log(`📊 [EVAL] ارزیابی شروع شد: ${data.data.evaluationId}`);
        });

        eventManager.onEvent('evaluation:completed', (data) => {
            console.log(`✅ [EVAL] ارزیابی تکمیل شد: ${data.data.evaluationId}`);
        });

        eventManager.onEvent('evaluation:submitted', (data) => {
            console.log(`📝 [EVAL] ارزیابی ارسال شد: ${data.data.evaluationId}`);
        });
    }

    // شروع ارزیابی جدید
    startEvaluation(userId, evaluationType = 'general') {
        const evaluationId = `eval_${userId}_${Date.now()}`;
        
        const evaluation = {
            id: evaluationId,
            userId: userId,
            type: evaluationType,
            status: 'started',
            startTime: new Date().toISOString(),
            questions: this.questions[evaluationType] || [],
            answers: {},
            score: 0
        };

        this.evaluations[evaluationId] = evaluation;
        this.saveData();

        eventManager.emitEvent('evaluation:started', { evaluationId, userId, type: evaluationType });
        return evaluation;
    }

    // پاسخ به سوال
    answerQuestion(evaluationId, questionId, answer) {
        if (!this.evaluations[evaluationId]) {
            throw new Error(`ارزیابی با ID ${evaluationId} یافت نشد`);
        }

        this.evaluations[evaluationId].answers[questionId] = {
            answer: answer,
            timestamp: new Date().toISOString()
        };

        this.saveData();
        return this.evaluations[evaluationId];
    }

    // تکمیل ارزیابی
    completeEvaluation(evaluationId) {
        if (!this.evaluations[evaluationId]) {
            throw new Error(`ارزیابی با ID ${evaluationId} یافت نشد`);
        }

        const evaluation = this.evaluations[evaluationId];
        evaluation.status = 'completed';
        evaluation.endTime = new Date().toISOString();
        evaluation.score = this.calculateScore(evaluation);

        this.saveData();

        eventManager.emitEvent('evaluation:completed', { evaluationId, score: evaluation.score });
        return evaluation;
    }

    // محاسبه امتیاز
    calculateScore(evaluation) {
        let totalScore = 0;
        let maxScore = 0;

        for (const question of evaluation.questions) {
            const answer = evaluation.answers[question.id];
            if (answer) {
                if (question.type === 'rating') {
                    const answerIndex = question.options.indexOf(answer.answer);
                    if (answerIndex !== -1) {
                        totalScore += answerIndex + 1;
                        maxScore += question.options.length;
                    }
                } else if (question.type === 'yes_no') {
                    if (answer.answer === 'بله') {
                        totalScore += 1;
                    }
                    maxScore += 1;
                }
            }
        }

        return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    }

    // ثبت داده‌های تمرین
    recordPractice(userId, practiceData) {
        if (!this.practiceData[userId]) {
            this.practiceData[userId] = [];
        }

        const practice = {
            id: `practice_${Date.now()}`,
            userId: userId,
            ...practiceData,
            timestamp: new Date().toISOString()
        };

        this.practiceData[userId].push(practice);
        this.saveData();

        eventManager.emitEvent('practice:recorded', { userId, practiceData });
        return practice;
    }

    // ثبت نظرسنجی رضایت
    recordSatisfaction(userId, satisfactionData) {
        this.satisfactionData[userId] = {
            ...satisfactionData,
            timestamp: new Date().toISOString()
        };

        this.saveData();
        return this.satisfactionData[userId];
    }

    // دریافت ارزیابی
    getEvaluation(evaluationId) {
        return this.evaluations[evaluationId] || null;
    }

    // دریافت ارزیابی‌های کاربر
    getUserEvaluations(userId) {
        return Object.values(this.evaluations).filter(eval => eval.userId === userId);
    }

    // دریافت سوالات
    getQuestions(type = 'general') {
        return this.questions[type] || [];
    }

    // دریافت داده‌های تمرین کاربر
    getUserPracticeData(userId) {
        return this.practiceData[userId] || [];
    }

    // دریافت نظرسنجی رضایت کاربر
    getUserSatisfaction(userId) {
        return this.satisfactionData[userId] || null;
    }

    // دریافت آمار ارزیابی
    getEvaluationStats() {
        const stats = {
            total: Object.keys(this.evaluations).length,
            completed: 0,
            inProgress: 0,
            averageScore: 0,
            byType: {},
            totalScore: 0
        };

        for (const evaluation of Object.values(this.evaluations)) {
            if (evaluation.status === 'completed') {
                stats.completed++;
                stats.totalScore += evaluation.score;
            } else {
                stats.inProgress++;
            }

            if (!stats.byType[evaluation.type]) {
                stats.byType[evaluation.type] = 0;
            }
            stats.byType[evaluation.type]++;
        }

        stats.averageScore = stats.completed > 0 ? Math.round(stats.totalScore / stats.completed) : 0;

        return stats;
    }

    // اضافه کردن سوال جدید
    addQuestion(type, question) {
        if (!this.questions[type]) {
            this.questions[type] = [];
        }

        const newQuestion = {
            id: `q${this.questions[type].length + 1}`,
            ...question,
            createdAt: new Date().toISOString()
        };

        this.questions[type].push(newQuestion);
        this.saveData();

        return newQuestion;
    }

    // حذف سوال
    removeQuestion(type, questionId) {
        if (this.questions[type]) {
            const index = this.questions[type].findIndex(q => q.id === questionId);
            if (index !== -1) {
                this.questions[type].splice(index, 1);
                this.saveData();
                return true;
            }
        }
        return false;
    }

    // پشتیبان‌گیری از داده‌ها
    backupData() {
        const backupFile = path.join(__dirname, 'data', `evaluation_system_backup_${Date.now()}.json`);
        try {
            fs.writeFileSync(backupFile, JSON.stringify({
                evaluations: this.evaluations,
                questions: this.questions,
                results: this.results,
                practiceData: this.practiceData,
                satisfactionData: this.satisfactionData,
                backupTime: new Date().toISOString()
            }, null, 2));
            console.log(`✅ [EVAL] پشتیبان‌گیری انجام شد: ${backupFile}`);
            return backupFile;
        } catch (error) {
            console.error('❌ [EVAL] خطا در پشتیبان‌گیری:', error.message);
            return null;
        }
    }
}

module.exports = EvaluationManager;

