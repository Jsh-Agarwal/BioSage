import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface AnalysisData {
  disease: string;
  score: number;
}

interface AnalysisChartProps {
  data: AnalysisData[];
}

const AnalysisChart: React.FC<AnalysisChartProps> = ({ data }) => {
  const d3Container = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (data && d3Container.current) {
      const svg = d3.select(d3Container.current);
      svg.selectAll("*").remove();

      const parent = d3Container.current.parentElement;
      if (!parent) return;

      const margin = { top: 20, right: 20, bottom: 120, left: 50 };
      const width = parent.clientWidth - margin.left - margin.right;
      const height = 300 - margin.top - margin.bottom;

      const chart = svg
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      const x = d3
        .scaleBand()
        .range([0, width])
        .domain(data.map(d => d.disease))
        .padding(0.3);

      const y = d3.scaleLinear().domain([0, 100]).range([height, 0]);

      chart
        .append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .attr('transform', 'translate(-10,0)rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '12px')
        .style('fill', '#a1a1aa');

      chart.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`))
        .selectAll('text')
        .style('font-size', '12px')
        .style('fill', '#a1a1aa');

      const tooltip = d3.select('body').append('div')
        .attr('class', 'd3-tooltip')
        .style('position', 'absolute')
        .style('z-index', '10')
        .style('visibility', 'hidden')
        .style('background', 'rgba(0, 0, 0, 0.75)')
        .style('color', '#fff')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px');

      chart
        .selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.disease)!.toFixed(2))
        .attr('y', height)
        .attr('height', 0)
        .attr('width', x.bandwidth())
        .attr('fill', d => (d.score > 60 ? '#dc2626' : d.score > 30 ? '#f97316' : '#22c55e'))
        .on('mouseover', function (event, d) {
          d3.select(this).style('opacity', 0.7);
          tooltip.style('visibility', 'visible').text(`${d.disease}: ${d.score}%`);
        })
        .on('mousemove', function (event) {
          tooltip.style('top', (event.pageY - 10) + 'px').style('left', (event.pageX + 10) + 'px');
        })
        .on('mouseout', function () {
          d3.select(this).style('opacity', 1);
          tooltip.style('visibility', 'hidden');
        })
        .transition()
        .duration(800)
        .attr('y', d => y(d.score))
        .attr('height', d => height - y(d.score));
    }
  }, [data]);

  return (
    <div className="mt-4 w-full">
        <h4 className="font-semibold text-center mb-2 text-sm text-muted-foreground">Diagnostic Confidence</h4>
        <div className="w-full">
            <svg
                className="d3-component"
                ref={d3Container}
            />
        </div>
    </div>
  );
};

export default AnalysisChart;
