"""
Report Agent - Generates daily simulation reports
Creates comprehensive reports with statistics, insights, and visualizations
"""
import logging
import json
from pathlib import Path
from datetime import datetime
from agents.state import SimulationState
from agents.config import get_agent_config

logger = logging.getLogger(__name__)
config = get_agent_config()


class ReportAgent:
    """
    Generates comprehensive simulation reports
    - Daily summaries
    - Statistics and trends
    - AI insights
    - Export to JSON/Markdown
    """

    def __init__(self):
        self.save_reports = config.save_reports
        self.report_dir = Path(config.report_directory)
        self.report_dir.mkdir(exist_ok=True)

    def _generate_report_content(self, state: SimulationState) -> dict:
        """
        Generate structured report content
        """
        report = {
            "metadata": {
                "simulation_day": state['simulation_day'],
                "date": state['current_date'].isoformat(),
                "generated_at": datetime.now().isoformat()
            },
            "population": {
                "total_individuals": state.get('total_individuals', 0),
                "new_today": len(state.get('new_individuals_today', [])),
                "active": len(state.get('active_individuals', []))
            },
            "contacts": {
                "created_today": state.get('contacts_created_today', 0),
                "total_cumulative": state.get('total_contacts', 0),
                "average_per_person": state.get('average_contacts', 0)
            },
            "infections": {
                "new_today": len(state.get('newly_infected', [])),
                "total_cumulative": state.get('total_infected', 0),
                "active": len(state.get('active_infections', [])),
                "recovered": len(state.get('recovered', [])),
                "r_value": state.get('r_value', 0)
            },
            "network": {
                "density": state.get('network_density', 0),
                "superspreaders": len(state.get('superspreaders', [])),
                "outbreak_detected": state.get('outbreak_detected', False)
            },
            "interventions": {
                "quarantined": len(state.get('quarantined', [])),
                "tested_today": len(state.get('tested_today', [])),
                "high_risk_count": len(state.get('high_risk_individuals', []))
            },
            "analysis": {
                "ai_insights": state.get('daily_analysis', 'No analysis available'),
                "recommendations": state.get('recommendations', []),
                "alerts": state.get('alerts', [])
            },
            "events": {
                "total_events": len(state.get('logs', [])),
                "errors": state.get('errors', [])
            }
        }

        return report

    def _generate_markdown_report(self, report: dict) -> str:
        """
        Generate human-readable markdown report
        """
        md = f"""# 🦠 PandemicNet Simulation Report

## Day {report['metadata']['simulation_day']} - {report['metadata']['date']}

---

### 📊 Population Summary

- **Total Individuals**: {report['population']['total_individuals']:,}
- **New Today**: {report['population']['new_today']}
- **Active**: {report['population']['active']}

---

### 🤝 Contact Network

- **Contacts Created Today**: {report['contacts']['created_today']:,}
- **Total Contacts**: {report['contacts']['total_cumulative']:,}
- **Average per Person**: {report['contacts']['average_per_person']:.1f}
- **Network Density**: {report['network']['density']:.4f}

---

### 🦠 Infection Status

- **New Cases Today**: {report['infections']['new_today']}
- **Total Cases**: {report['infections']['total_cumulative']}
- **Active Infections**: {report['infections']['active']}
- **Recovered**: {report['infections']['recovered']}
- **R Value**: {report['infections']['r_value']:.2f}

**Status**: {'🚨 OUTBREAK DETECTED' if report['network']['outbreak_detected'] else '✅ Normal'}

---

### 🚨 Interventions

- **Quarantined**: {report['interventions']['quarantined']}
- **Tested Today**: {report['interventions']['tested_today']}
- **High Risk Monitored**: {report['interventions']['high_risk_count']}
- **Superspreaders Identified**: {report['network']['superspreaders']}

---

### 🤖 AI Analysis

{report['analysis']['ai_insights']}

"""

        # Add recommendations
        if report['analysis']['recommendations']:
            md += "\n### 💡 Recommendations\n\n"
            for i, rec in enumerate(report['analysis']['recommendations'], 1):
                md += f"{i}. {rec}\n"

        # Add alerts
        if report['analysis']['alerts']:
            md += "\n### ⚠️ Alerts\n\n"
            for alert in report['analysis']['alerts']:
                md += f"- {alert}\n"

        # Add errors
        if report['events']['errors']:
            md += "\n### ❌ Errors\n\n"
            for error in report['events']['errors']:
                md += f"- {error}\n"

        md += f"\n---\n\n*Generated: {report['metadata']['generated_at']}*\n"

        return md

    def _save_report(self, report: dict, markdown: str, day: int):
        """
        Save report to files
        """
        # Save JSON
        json_path = self.report_dir / f"day_{day:03d}_report.json"
        with open(json_path, 'w') as f:
            json.dump(report, f, indent=2)

        # Save Markdown
        md_path = self.report_dir / f"day_{day:03d}_report.md"
        with open(md_path, 'w') as f:
            f.write(markdown)

        logger.info(f"📄 Report saved: {json_path.name}")

        return str(json_path), str(md_path)

    async def __call__(self, state: SimulationState) -> SimulationState:
        """
        Main agent function - called by LangGraph
        """
        logger.info(f"📊 Report Agent: Day {state['simulation_day']}")

        try:
            # Generate report content
            report = self._generate_report_content(state)

            # Generate markdown
            markdown = self._generate_markdown_report(report)

            # Save if enabled
            if self.save_reports:
                json_path, md_path = self._save_report(
                    report,
                    markdown,
                    state['simulation_day']
                )

                state["messages"].append(
                    f"Report Agent: Report saved to {Path(json_path).name}"
                )
            else:
                state["messages"].append(
                    "Report Agent: Report generated (not saved)"
                )

            # Print summary to console
            print("\n" + "=" * 60)
            print(f"📊 DAY {state['simulation_day']} SUMMARY")
            print("=" * 60)
            print(f"Population: {report['population']['total_individuals']:,}")
            print(f"New Contacts: {report['contacts']['created_today']:,}")
            print(f"New Infections: {report['infections']['new_today']}")
            print(f"R Value: {report['infections']['r_value']:.2f}")
            print(f"Quarantined: {report['interventions']['quarantined']}")
            if report['analysis']['alerts']:
                print("\n⚠️  ALERTS:")
                for alert in report['analysis']['alerts']:
                    print(f"  - {alert}")
            print("=" * 60 + "\n")

            logger.info("✅ Report generated successfully")

        except Exception as e:
            error_msg = f"Report Agent error: {str(e)}"
            logger.error(error_msg)
            state["errors"].append(error_msg)

        return state


# Create agent instance
report_agent = ReportAgent()