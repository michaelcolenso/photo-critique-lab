<script lang="ts">
  let { label, score }: { label: string; score: { value: number; reason: string } } = $props();
</script>

<details class="score-card">
  <summary
    ><span>{label}</span><span class="score-value">{score.value}<small>/100</small></span><span
      class="score-track"><span style:width={`${score.value}%`}></span></span
    ></summary
  >
  <p>{score.reason}</p>
</details>
