import json

from django.core.management.base import BaseCommand

from apps.trading.services.agents.orchestrator import Orchestrator


class Command(BaseCommand):
    help = "Run a single TradeMind AI trading cycle (discover → decide → execute → monitor)."

    def handle(self, *args, **options):
        self.stdout.write("Running trading cycle…")
        summary = Orchestrator().run_cycle()
        self.stdout.write(self.style.SUCCESS("Cycle complete."))
        self.stdout.write(
            json.dumps(
                {
                    "discovered": summary["discovered"],
                    "opened": summary["opened"],
                    "closed": summary["closed"],
                },
                indent=2,
            )
        )
