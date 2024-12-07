<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class LogLine extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:log-line';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        info('Executed', ['time' => now()]);
    }
}
