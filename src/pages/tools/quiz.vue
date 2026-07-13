<template>
  <view class="quiz-page">
    <view v-if="!started" class="quiz-start">
      <text class="start-icon">💕</text>
      <text class="start-title">默契问答</text>
      <text class="start-desc">看看你们有多了解彼此</text>
      <GradientButton text="开始答题" @click="startQuiz" />
    </view>
    <view v-else-if="currentQuestion" class="quiz-content">
      <view class="progress-bar">
        <view class="progress-fill" :style="{ width: (currentIndex / questions.length * 100) + '%' }"></view>
      </view>
      <text class="question-num">第 {{ currentIndex + 1 }} / {{ questions.length }} 题</text>
      <view class="question-card card">
        <text class="question-text">{{ currentQuestion.question }}</text>
        <view class="options">
          <view v-for="(opt, i) in currentQuestion.options" :key="i" class="option-item" :class="{ selected: selectedAnswer === i }" @click="selectedAnswer = i">
            <text>{{ opt }}</text>
          </view>
        </view>
      </view>
      <GradientButton :text="currentIndex < questions.length - 1 ? '下一题' : '查看结果'" @click="nextQuestion" :disabled="selectedAnswer === null" />
    </view>
    <view v-else class="quiz-result">
      <text class="result-icon">🎉</text>
      <text class="result-title">默契度</text>
      <text class="result-score">{{ score }} / {{ questions.length }}</text>
      <text class="result-desc">{{ scorePercent >= 80 ? '你们太默契了！' : scorePercent >= 50 ? '还不错，继续加油！' : '要多了解对方哦~' }}</text>
      <GradientButton text="再来一次" @click="resetQuiz" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { quizzes } from '../../data/quizzes'
import GradientButton from '../../components/common/GradientButton.vue'

const started = ref(false)
const currentIndex = ref(0)
const selectedAnswer = ref(null)
const answers = ref([])
const questions = ref([])

const currentQuestion = computed(() => questions.value[currentIndex.value] || null)
const score = computed(() => answers.value.filter((a, i) => a === questions.value[i]?.answer).length)
const scorePercent = computed(() => Math.round((score.value / questions.value.length) * 100))

const startQuiz = () => {
  questions.value = [...quizzes].sort(() => Math.random() - 0.5).slice(0, 10)
  started.value = true
  currentIndex.value = 0
  answers.value = []
  selectedAnswer.value = null
}
const nextQuestion = () => {
  answers.value.push(selectedAnswer.value)
  selectedAnswer.value = null
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  } else {
    currentIndex.value = questions.value.length // show result
  }
}
const resetQuiz = () => { started.value = false; currentIndex.value = 0; answers.value = [] }
</script>

<style lang="scss" scoped>
.quiz-page { min-height: 100vh; background: var(--color-bg); padding: 30rpx; padding-bottom: calc(30rpx + constant(safe-area-inset-bottom)); padding-bottom: calc(30rpx + env(safe-area-inset-bottom)); }
.quiz-start { text-align: center; padding-top: 150rpx;
  .start-icon { font-size: 120rpx; display: block; margin-bottom: 20rpx; }
  .start-title { font-size: var(--font-size-xl); font-weight: bold; color: var(--color-text); display: block; margin-bottom: 12rpx; }
  .start-desc { font-size: var(--font-size-base); color: var(--color-text-secondary); display: block; margin-bottom: 40rpx; }
}
.quiz-content { .progress-bar { height: 8rpx; background: var(--color-bg-secondary); border-radius: 4rpx; margin-bottom: 20rpx; overflow: hidden;
    .progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-gradient-start), var(--color-gradient-end)); border-radius: 4rpx; transition: width 0.3s; }
  }
  .question-num { font-size: var(--font-size-sm); color: var(--color-text-light); display: block; margin-bottom: 16rpx; }
}
.question-card { padding: 40rpx; margin-bottom: 30rpx;
  .question-text { font-size: var(--font-size-lg); font-weight: bold; color: var(--color-text); display: block; margin-bottom: 30rpx; }
  .options { display: flex; flex-direction: column; gap: 16rpx;
    .option-item { padding: 24rpx; background: var(--color-bg); border-radius: var(--radius-input); font-size: var(--font-size-base); color: var(--color-text); border: 2rpx solid transparent;
      &.selected { border-color: var(--color-primary); background: var(--color-bg-secondary); color: var(--color-primary); }
    }
  }
}
.quiz-result { text-align: center; padding-top: 150rpx;
  .result-icon { font-size: 120rpx; display: block; margin-bottom: 20rpx; }
  .result-title { font-size: var(--font-size-lg); color: var(--color-text-secondary); display: block; }
  .result-score { font-size: 96rpx; font-weight: bold; color: var(--color-primary); display: block; margin: 20rpx 0; }
  .result-desc { font-size: var(--font-size-base); color: var(--color-text-secondary); display: block; margin-bottom: 40rpx; }
}
.card { background: var(--color-card); border-radius: var(--radius-card); box-shadow: var(--shadow-card); }
</style>
